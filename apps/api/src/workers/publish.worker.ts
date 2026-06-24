import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { PublisherService } from '../modules/publisher/publisher.service';

interface PublishJobData {
  blogId: string;
  userId: string;
  scheduleId?: string;
}

@Processor('publish-queue')
@Injectable()
export class PublishWorker {
  private readonly logger = new Logger(PublishWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly publisherService: PublisherService,
  ) {}

  @Process('publish-blog')
  async handlePublish(job: Job<PublishJobData>) {
    const { blogId, userId, scheduleId } = job.data;
    this.logger.log(`Processing publish job ${job.id} for blog ${blogId}`);

    try {
      await job.progress(10);

      // Publish to Medium via PublisherService
      const result = await this.publisherService.publishToMedium(blogId, userId);

      await job.progress(90);

      // If triggered from a schedule, update the schedule record
      if (scheduleId) {
        await this.prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            status: 'PUBLISHED',
            publishedAt: new Date(),
          },
        });
      }

      await job.progress(100);

      this.logger.log(`Blog ${blogId} published successfully to Medium: ${result.url}`);

      return { blogId, mediumUrl: result.url, status: 'published' };
    } catch (error) {
      this.logger.error(
        `Publish job ${job.id} failed for blog ${blogId}: ${(error as Error).message}`,
        (error as Error).stack,
      );

      // Update schedule status to FAILED if applicable
      if (scheduleId) {
        await this.prisma.schedule.update({
          where: { id: scheduleId },
          data: {
            status: 'FAILED',
            errorMessage: (error as Error).message,
          },
        }).catch(() => {});
      }

      // Mark blog as FAILED
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: 'FAILED' },
      }).catch(() => {});

      throw error;
    }
  }
}
