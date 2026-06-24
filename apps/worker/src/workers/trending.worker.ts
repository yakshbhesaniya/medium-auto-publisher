import { Worker, Job, Queue } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import axios from 'axios';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';

export function startTrendingWorker(): Worker {
  const worker = new Worker(
    'trending-queue',
    async (job: Job) => {
      logger.info(`[TrendingWorker] Discovering new trending topics...`);

      try {
        // Find admin user to assign topics to (or a system user)
        // For SaaS, we might want to discover topics per user based on their preferences,
        // but for now, we'll assign trending topics to all active users or just pull a generic list
        // and let users claim them. We will create the topics for the first active user for simplicity.
        const user = await prisma.user.findFirst({ where: { isActive: true } });
        if (!user) {
          logger.warn(`[TrendingWorker] No active users found. Skipping discovery.`);
          return { success: true, count: 0 };
        }

        let addedCount = 0;

        // 1. Fetch from Dev.to
        try {
          const devToRes = await axios.get('https://dev.to/api/articles?top=1');
          const articles = devToRes.data.slice(0, 3);
          for (const article of articles) {
            const exists = await prisma.topic.findFirst({ where: { title: article.title, userId: user.id } });
            if (!exists) {
              const newTopic = await prisma.topic.create({
                data: {
                  title: article.title,
                  description: `Trending on Dev.to: ${article.description}\n\nTags: ${article.tags}`,
                  source: 'DEV_TO',
                  userId: user.id,
                  isTrending: true,
                },
              });
              const evalQueue = new Queue('evaluation-queue', { connection: getRedisConnection() });
              await evalQueue.add('evaluate-topic', { topicId: newTopic.id, userId: user.id });
              addedCount++;
            }
          }
        } catch (e: any) {
          logger.error(`[TrendingWorker] Failed to fetch Dev.to:`, e.message);
        }

        // 2. Fetch from HackerNews (Top Stories)
        try {
          const hnTopRes = await axios.get('https://hacker-news.firebaseio.com/v0/topstories.json');
          const topIds = hnTopRes.data.slice(0, 3);
          for (const id of topIds) {
            const itemRes = await axios.get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
            const article = itemRes.data;
            if (article && article.title && !article.title.startsWith('Ask HN:')) {
              const exists = await prisma.topic.findFirst({ where: { title: article.title, userId: user.id } });
              if (!exists) {
                const newTopic = await prisma.topic.create({
                  data: {
                    title: article.title,
                    description: `Trending on HackerNews.\n\nLink: ${article.url || ''}`,
                    source: 'HACKER_NEWS',
                    userId: user.id,
                    isTrending: true,
                  },
                });
                const evalQueue = new Queue('evaluation-queue', { connection: getRedisConnection() });
                await evalQueue.add('evaluate-topic', { topicId: newTopic.id, userId: user.id });
                addedCount++;
              }
            }
          }
        } catch (e: any) {
          logger.error(`[TrendingWorker] Failed to fetch HackerNews:`, e.message);
        }

        logger.info(`[TrendingWorker] ✅ Discovered ${addedCount} new trending topics.`);
        return { success: true, count: addedCount };
      } catch (error) {
        logger.error(`[TrendingWorker] ❌ Failed during discovery:`, error);
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[TrendingWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[TrendingWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}

export async function setupTrendingCron() {
  const queue = new Queue('trending-queue', { connection: getRedisConnection() });
  
  // Run every 12 hours
  await queue.add('discover-trending', {}, {
    repeat: {
      pattern: '0 */12 * * *',
    },
  });

  // Also add an immediate job just to populate it now
  await queue.add('discover-trending-immediate', {});

  logger.info(`[TrendingWorker] Scheduled cron for trending discovery.`);
}
