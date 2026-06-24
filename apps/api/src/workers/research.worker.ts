import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { ResearchAgent } from '@medium-publisher/ai';
import { OpenAIProvider } from '@medium-publisher/ai';
import { ConfigService } from '@nestjs/config';

interface ResearchJobData {
  topicId: string;
  userId: string;
}

@Processor('research-queue')
@Injectable()
export class ResearchWorker {
  private readonly logger = new Logger(ResearchWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Process('research-topic')
  async handleResearch(job: Job<ResearchJobData>) {
    const { topicId, userId } = job.data;
    this.logger.log(`Processing research job ${job.id} for topic ${topicId}`);

    try {
      // 1. Update topic status to IN_PROGRESS
      await this.prisma.topic.update({
        where: { id: topicId },
        data: { status: 'IN_PROGRESS' },
      });

      await job.progress(10);

      // 2. Get topic details
      const topic = await this.prisma.topic.findUnique({
        where: { id: topicId },
      });

      if (!topic) {
        throw new Error(`Topic ${topicId} not found`);
      }

      // 3. Run ResearchAgent
      const openai = new OpenAIProvider(
        this.configService.get<string>('AI_FAST_MODEL', 'gpt-4o'),
      );
      const researchAgent = new ResearchAgent(openai);

      await job.progress(20);

      const researchData = await researchAgent.research(topic as any);

      await job.progress(80);

      // 4. Save Research to DB (upsert in case of retry)
      await this.prisma.research.upsert({
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
          rawNotes: (researchData as any).rawNotes,
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
          rawNotes: (researchData as any).rawNotes,
        },
      });

      await job.progress(95);

      // 5. Update topic status to COMPLETED
      await this.prisma.topic.update({
        where: { id: topicId },
        data: { status: 'COMPLETED' },
      });

      await job.progress(100);

      this.logger.log(`Research completed for topic ${topicId}`);

      return { topicId, status: 'completed' };
    } catch (error) {
      this.logger.error(
        `Research job ${job.id} failed for topic ${topicId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      // Reset topic status on failure
      await this.prisma.topic.update({
        where: { id: topicId },
        data: { status: 'APPROVED' }, // Reset to approved so it can be retried
      }).catch(() => {});

      throw error;
    }
  }
}
