import { Worker, Job } from 'bullmq';
import { prisma } from '@medium-publisher/database';
import { BlogPipeline, PipelineProgress } from '@medium-publisher/ai';
import { BlogMode, BlogTone } from '@medium-publisher/types';
import { getRedisConnection } from '../utils/redis';
import { logger } from '../utils/logger';

interface BlogGenJobData {
  topicId: string;
  blogId: string;
  mode: BlogMode;
  tone: BlogTone;
  userId: string;
  generateCoverImage?: boolean;
}

export function startBlogGenWorker(): Worker {
  const worker = new Worker<BlogGenJobData>(
    'blog-gen-queue',
    async (job: Job<BlogGenJobData>) => {
      const { topicId, blogId, mode, tone, userId, generateCoverImage = true } = job.data;
      logger.info(`[BlogGenWorker] Processing blog ${blogId} for topic ${topicId}`);

      try {
        // Update blog status
        await prisma.blog.update({
          where: { id: blogId },
          data: { status: 'GENERATING' },
        });

        // Fetch topic with research
        const topic = await prisma.topic.findUniqueOrThrow({
          where: { id: topicId },
          include: { research: true },
        });

        // Progress callback — updates DB and job progress
        const onProgress = async (progress: PipelineProgress) => {
          await job.updateProgress(progress.progress);

          // Map pipeline stage to blog status
          const stageToStatus: Record<string, string> = {
            research: 'RESEARCHING',
            outline: 'GENERATING',
            writing: 'GENERATING',
            humanizing: 'HUMANIZING',
            editing: 'HUMANIZING',
            seo: 'HUMANIZING',
            cover_image: 'REVIEW',
            complete: 'REVIEW',
          };

          const status = stageToStatus[progress.stage] ?? 'GENERATING';
          await prisma.blog.update({
            where: { id: blogId },
            data: { status: status as any },
          }).catch(() => {});

          logger.info(`[BlogGenWorker] ${progress.progress}% — ${progress.message}`);
        };

        // Run the full pipeline
        const pipeline = new BlogPipeline(onProgress);
        const result = await pipeline.run(topic as any, mode, tone, generateCoverImage);

        // Save final blog
        await prisma.blog.update({
          where: { id: blogId },
          data: {
            title: result.title,
            subtitle: result.subtitle,
            slug: result.slug,
            markdownContent: result.markdownContent,
            content: result.markdownContent, // Store markdown as both for now
            metaDescription: result.metaDescription,
            tags: result.tags,
            focusKeyword: result.focusKeyword,
            wordCount: result.wordCount,
            readTimeMinutes: result.readTimeMinutes,
            aiProbabilityScore: result.metrics.aiProbabilityScore,
            burstinessScore: result.metrics.burstinessScore,
            lexicalRichness: result.metrics.lexicalRichness,
            readabilityScore: result.metrics.readabilityScore,
            coverImageUrl: result.coverImageUrl || null,
            coverImagePrompts: result.coverImagePrompts as any,
            coverImageVariants: result.coverImageVariants as any,
            internalLinkSuggestions: result.internalLinkSuggestions as any,
            outline: result.outline as any,
            status: 'REVIEW',
          },
        });

        // If topic had no research yet, save it
        if (!topic.research) {
          await prisma.research.create({
            data: {
              topicId,
              whatIsIt: result.research.whatIsIt,
              whyItMatters: result.research.whyItMatters,
              currentTrends: result.research.currentTrends,
              statistics: result.research.statistics as any,
              realExamples: result.research.realExamples as any,
              faqs: result.research.faqs as any,
              gaps: result.research.gaps,
              references: result.research.references as any,
              contrarian: result.research.contrarian,
              keyInsights: result.research.keyInsights,
            },
          }).catch(() => {});
        }

        logger.info(`[BlogGenWorker] ✅ Blog ${blogId} generated successfully`);
        logger.info(`   Words: ${result.wordCount}, Read: ${result.readTimeMinutes.toFixed(1)}min, AI Score: ${result.metrics.aiProbabilityScore}/100`);

        return { success: true, blogId, metrics: result.metrics };
      } catch (error) {
        logger.error(`[BlogGenWorker] ❌ Failed for blog ${blogId}:`, error);

        await prisma.blog.update({
          where: { id: blogId },
          data: { status: 'FAILED' },
        }).catch(() => {});

        throw error;
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 2, // Limit to 2 concurrent to control AI API costs
    },
  );

  worker.on('progress', (job, progress) => {
    logger.info(`[BlogGenWorker] Job ${job.id}: ${progress}%`);
  });

  worker.on('completed', (job) => {
    logger.info(`[BlogGenWorker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`[BlogGenWorker] Job ${job?.id} failed:`, err.message);
  });

  return worker;
}
