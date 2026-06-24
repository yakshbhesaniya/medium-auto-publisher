import { Worker, Job } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';
import { createDecipheriv, scryptSync } from 'crypto';
import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';

chromium.use(stealth());

interface PublishJobData {
  blogId: string;
  userId: string;
  scheduleId?: string;
  publishStatus?: 'public' | 'draft' | 'unlisted';
}

function decryptCookies(encryptedToken: string): string {
  const key = scryptSync(process.env.ENCRYPTION_KEY ?? 'default-key-change-me', 'salt', 32);
  const [ivHex, encrypted] = encryptedToken.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8');
}

export function startPublishWorker(): Worker {
  const worker = new Worker<PublishJobData>(
    'publish-queue',
    async (job: Job<PublishJobData>) => {
      const { blogId, userId, scheduleId, publishStatus = 'public' } = job.data;
      logger.info(`[PublishWorker] Publishing blog ${blogId} to Medium via Playwright`);

      let browser;
      try {
        const blog = await prisma.blog.findUniqueOrThrow({ where: { id: blogId } });
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

        if (!user.mediumCookies) {
          throw new Error('No Medium session cookies found. Please run the login script first.');
        }

        const cookiesJson = decryptCookies(user.mediumCookies);
        const cookies = JSON.parse(cookiesJson);

        logger.info(`[PublishWorker] Launching headless browser...`);
        browser = await chromium.launch({ headless: true });
        
        const context = await browser.newContext({
          permissions: ['clipboard-read', 'clipboard-write'],
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        await context.addCookies(cookies);
        const page = await context.newPage();

        logger.info(`[PublishWorker] Navigating to Medium editor...`);
        await page.goto('https://medium.com/new-story', { waitUntil: 'domcontentloaded' });
        
        // Ensure we are logged in (if it redirects to signin, cookies are expired)
        if (page.url().includes('signin')) {
           throw new Error('Medium session expired. Please re-run the login script.');
        }

        logger.info(`[PublishWorker] Injecting content...`);
        
        // Wait for the editor to load
        await page.waitForSelector('[data-default-value="Title"]', { timeout: 15000 });
        
        // Fill title
        await page.fill('[data-default-value="Title"]', blog.title);
        await page.keyboard.press('Enter');
        
        // Copy markdown content to clipboard
        await page.evaluate(async (text) => {
          await (navigator as any).clipboard.writeText(text);
        }, blog.markdownContent);

        // Paste it (Medium handles markdown pasting automatically)
        const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
        await page.keyboard.press(`${modifier}+V`);
        
        // Wait for it to paste and auto-save
        await page.waitForTimeout(5000);

        if (publishStatus === 'public') {
          logger.info(`[PublishWorker] Clicking Publish...`);
          // Click the top "Publish" button to open the tag dialog
          await page.click('button:has-text("Publish")');
          
          // Wait for the tag input to appear
          const tagInputSelector = 'input[placeholder="Add a tag..."]';
          await page.waitForSelector(tagInputSelector, { timeout: 10000 }).catch(() => null);
          
          // Add tags
          for (const tag of blog.tags.slice(0, 5)) {
            await page.fill(tagInputSelector, tag);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
          }

          // Click the final "Publish now" button
          await page.click('button:has-text("Publish now")');
          
          logger.info(`[PublishWorker] Waiting for publication...`);
          // Wait for the navigation to the published article
          await page.waitForNavigation({ timeout: 30000 });
        } else {
          // Just save as draft
          logger.info(`[PublishWorker] Saved as Draft.`);
        }

        const mediumUrl = page.url();
        logger.info(`[PublishWorker] ✅ Successfully published! URL: ${mediumUrl}`);

        // Save published post record
        await prisma.publishedPost.upsert({
          where: { blogId },
          create: {
            blogId,
            mediumUrl: mediumUrl,
            mediumSlug: mediumUrl.split('/').pop() ?? '',
            platform: 'MEDIUM',
          },
          update: {
            mediumUrl: mediumUrl,
            publishedAt: new Date(),
          },
        });

        await prisma.blog.update({
          where: { id: blogId },
          data: { status: publishStatus === 'public' ? 'PUBLISHED' : 'DRAFT' },
        });

        if (scheduleId) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
          });
        }

        await prisma.analytics.create({
          data: { blogId, views: 0, reads: 0, readRatio: 0, earnings: 0 },
        }).catch(() => {});

        return { success: true, mediumUrl };
      } catch (error: any) {
        logger.error(`[PublishWorker] ❌ Failed to publish blog ${blogId}:`, error);

        if (scheduleId) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'FAILED', errorMessage: error.message },
          }).catch(() => {});
        }

        throw error;
      } finally {
        if (browser) {
          await browser.close();
        }
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 2, // Playwright is heavy, keep concurrency low
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[PublishWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[PublishWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
