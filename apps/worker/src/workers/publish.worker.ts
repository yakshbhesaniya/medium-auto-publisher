import { Worker, Job } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import axios from 'axios';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';
import { createDecipheriv, createCipheriv, randomBytes, scryptSync } from 'crypto';

interface PublishJobData {
  blogId: string;
  userId: string;
  scheduleId?: string;
  publishStatus?: 'public' | 'draft' | 'unlisted';
}

// Decrypt Medium token stored in DB
function decryptToken(encryptedToken: string): string {
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
      logger.info(`[PublishWorker] Publishing blog ${blogId} to Medium`);

      try {
        // Fetch blog
        const blog = await prisma.blog.findUniqueOrThrow({ where: { id: blogId } });

        // Fetch user with encrypted Medium token
        const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

        if (!user.mediumToken) {
          throw new Error('No Medium integration token found. Please add your token in Settings.');
        }

        // Decrypt the Medium token
        const mediumToken = user.mediumToken.includes(':')
          ? decryptToken(user.mediumToken)
          : user.mediumToken;

        // Step 1: Get Medium user ID
        const meResponse = await axios.get('https://api.medium.com/v1/me', {
          headers: {
            Authorization: `Bearer ${mediumToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });

        const mediumUserId = meResponse.data.data.id;

        // Step 2: Publish the post via official Medium API
        // Using markdown format — Medium accepts HTML and markdown
        const publishResponse = await axios.post(
          `https://api.medium.com/v1/users/${mediumUserId}/posts`,
          {
            title: blog.title,
            contentFormat: 'markdown',
            content: blog.markdownContent,
            tags: blog.tags.slice(0, 5), // Medium allows max 5 tags
            publishStatus,
            notifyFollowers: publishStatus === 'public',
          },
          {
            headers: {
              Authorization: `Bearer ${mediumToken}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        );

        const mediumPost = publishResponse.data.data;

        // Save published post record
        await prisma.publishedPost.upsert({
          where: { blogId },
          create: {
            blogId,
            mediumId: mediumPost.id,
            mediumUrl: mediumPost.url,
            mediumSlug: mediumPost.url.split('/').pop() ?? '',
            platform: 'MEDIUM',
          },
          update: {
            mediumId: mediumPost.id,
            mediumUrl: mediumPost.url,
            publishedAt: new Date(),
          },
        });

        // Update blog status
        await prisma.blog.update({
          where: { id: blogId },
          data: { status: 'PUBLISHED' },
        });

        // Update schedule if exists
        if (scheduleId) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'PUBLISHED', publishedAt: new Date() },
          });
        }

        // Create initial analytics record
        await prisma.analytics.create({
          data: { blogId, views: 0, reads: 0, readRatio: 0, earnings: 0 },
        }).catch(() => {});

        logger.info(`[PublishWorker] ✅ Blog ${blogId} published to Medium: ${mediumPost.url}`);
        return { success: true, mediumUrl: mediumPost.url };
      } catch (error: any) {
        logger.error(`[PublishWorker] ❌ Failed to publish blog ${blogId}:`, error.message);

        if (scheduleId) {
          await prisma.schedule.update({
            where: { id: scheduleId },
            data: { status: 'FAILED', errorMessage: error.message },
          }).catch(() => {});
        }

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
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
