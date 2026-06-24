import { Worker, Job } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import { ResearchAgent } from '@medium-publisher/ai';
import { OpenAIProvider } from '@medium-publisher/ai';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';

interface ResearchJobData {
  topicId: string;
  userId: string;
}

export function startResearchWorker(): Worker {
  const worker = new Worker<ResearchJobData>(
    'research-queue',
    async (job: Job<ResearchJobData>) => {
      const { topicId, userId } = job.data;
      logger.info(`[ResearchWorker] Processing topic ${topicId}`);

      try {
        // Update topic status
        await prisma.topic.update({
          where: { id: topicId },
          data: { status: 'IN_PROGRESS' },
        });

        // Fetch topic
        const topic = await prisma.topic.findUniqueOrThrow({ where: { id: topicId } });

        // Run research agent
        const researchAgent = new ResearchAgent(new OpenAIProvider('gpt-4o'));
        const researchData = await researchAgent.research(topic as any);

        // Save research
        await prisma.research.upsert({
          where: { topicId },
          create: {
            topicId,
            whatIsIt: researchData.whatIsIt,
            whyItMatters: researchData.whyItMatters,
            currentTrends: researchData.currentTrends,
            statistics: researchData.statistics as any,
            realExamples: researchData.realExamples as any,
            faqs: researchData.faqs as any,
            gaps: researchData.gaps,
            references: researchData.references as any,
            contrarian: researchData.contrarian,
            keyInsights: researchData.keyInsights,
          },
          update: {
            whatIsIt: researchData.whatIsIt,
            whyItMatters: researchData.whyItMatters,
            currentTrends: researchData.currentTrends,
            statistics: researchData.statistics as any,
            realExamples: researchData.realExamples as any,
            faqs: researchData.faqs as any,
            gaps: researchData.gaps,
            references: researchData.references as any,
            contrarian: researchData.contrarian,
            keyInsights: researchData.keyInsights,
          },
        });

        // Update topic status
        await prisma.topic.update({
          where: { id: topicId },
          data: { status: 'COMPLETED' },
        });

        logger.info(`[ResearchWorker] ✅ Research complete for topic ${topicId}`);
        return { success: true, topicId };
      } catch (error) {
        logger.error(`[ResearchWorker] ❌ Failed for topic ${topicId}:`, error);

        await prisma.topic.update({
          where: { id: topicId },
          data: { status: 'PENDING' },
        }).catch(() => {});

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    },
  );

  worker.on('completed', (job) => {
    logger.info(`[ResearchWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[ResearchWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
