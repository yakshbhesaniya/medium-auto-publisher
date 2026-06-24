import { Worker } from 'bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';

export function startScheduleWorker(): Worker {
  // This worker polls for due schedules every minute using a recurring job
  const schedulerQueue = new Queue('schedule-poll', {
    connection: getRedisConnection(),
  });

  // Add recurring poll job
  schedulerQueue.add('poll', {}, {
    repeat: { every: 60000 }, // Every 60 seconds
    removeOnComplete: true,
  }).catch(err => logger.error('Failed to add schedule poll job:', err));

  const publishQueue = new Queue('publish-queue', {
    connection: getRedisConnection(),
  });

  const worker = new Worker(
    'schedule-poll',
    async () => {
      const now = new Date();
      logger.info(`[ScheduleWorker] Checking for due schedules at ${now.toISOString()}`);

      const dueSchedules = await prisma.schedule.findMany({
        where: {
          status: 'PENDING',
          scheduledAt: { lte: now },
        },
        include: { blog: { select: { userId: true } } },
        take: 20,
      });

      if (dueSchedules.length === 0) {
        return { processed: 0 };
      }

      logger.info(`[ScheduleWorker] Found ${dueSchedules.length} due schedules`);

      for (const schedule of dueSchedules) {
        await publishQueue.add('publish', {
          blogId: schedule.blogId,
          userId: schedule.blog.userId,
          scheduleId: schedule.id,
          publishStatus: 'public',
        });

        // Mark schedule as processing to avoid duplicate processing
        await prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: 'PUBLISHED' }, // Optimistic update
        });
      }

      logger.info(`[ScheduleWorker] Queued ${dueSchedules.length} publish jobs`);
      return { processed: dueSchedules.length };
    },
    {
      connection: getRedisConnection(),
      concurrency: 1,
    },
  );

  return worker;
}
