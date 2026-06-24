import { Worker, Job } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import { DiscoveryAgent } from '@medium-publisher/ai';
import { OpenAIProvider } from '@medium-publisher/ai';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';

interface EvaluationJobData {
  topicId: string;
  userId: string;
}

export function startEvaluationWorker(): Worker {
  const worker = new Worker<EvaluationJobData>(
    'evaluation-queue',
    async (job: Job<EvaluationJobData>) => {
      const { topicId, userId } = job.data;
      logger.info(`[EvaluationWorker] Evaluating topic ${topicId}`);

      try {
        const topic = await prisma.topic.findUniqueOrThrow({ where: { id: topicId } });

        const discoveryAgent = new DiscoveryAgent(new OpenAIProvider('gpt-4o'));
        const proposal = await discoveryAgent.evaluateTopic(topic.title, topic.description || undefined);

        await prisma.topic.update({
          where: { id: topicId },
          data: { proposedPlan: proposal as any },
        });

        logger.info(`[EvaluationWorker] ✅ Evaluation complete for topic ${topicId}`);
        return { success: true, topicId };
      } catch (error) {
        logger.error(`[EvaluationWorker] ❌ Failed to evaluate topic ${topicId}:`, error);
        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 5,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[EvaluationWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[EvaluationWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
