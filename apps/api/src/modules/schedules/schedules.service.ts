import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('publish-queue') private readonly publishQueue: Queue,
  ) {}

  async create(userId: string, dto: CreateScheduleDto) {
    // Verify blog belongs to user
    const blog = await this.prisma.blog.findFirst({
      where: { id: dto.blogId, userId },
      select: { id: true, status: true, content: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${dto.blogId}" not found`);
    }

    if (blog.status === 'PUBLISHED') {
      throw new BadRequestException('Blog is already published');
    }

    const scheduledAt = new Date(dto.scheduledAt);
    if (scheduledAt <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        blogId: dto.blogId,
        scheduledAt,
        status: 'PENDING',
      },
    });

    await this.prisma.blog.update({
      where: { id: dto.blogId },
      data: { status: 'SCHEDULED' },
    });

    this.logger.log(`Blog ${dto.blogId} scheduled for ${scheduledAt.toISOString()}`);

    return schedule;
  }

  async findAll(userId: string) {
    return this.prisma.schedule.findMany({
      where: { blog: { userId } },
      include: {
        blog: {
          select: {
            id: true,
            title: true,
            status: true,
            coverImageUrl: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string): Promise<any> {
    const schedule = await this.prisma.schedule.findFirst({
      where: { id, blog: { userId } },
      include: { blog: true },
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID "${id}" not found`);
    }

    return schedule;
  }

  async cancel(id: string, userId: string) {
    const schedule = await this.findOne(id, userId);

    if (schedule.status !== 'PENDING') {
      throw new BadRequestException(`Cannot cancel a schedule with status: ${schedule.status}`);
    }

    await this.prisma.schedule.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    // Reset blog status to REVIEW
    await this.prisma.blog.update({
      where: { id: schedule.blogId },
      data: { status: 'REVIEW' },
    });

    return { message: 'Schedule cancelled successfully' };
  }

  /**
   * Cron job — runs every minute to process due schedules.
   * Finds all PENDING schedules where scheduledAt <= now
   * and adds them to the publish queue.
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processDueSchedules() {
    const now = new Date();

    const dueSchedules = await this.prisma.schedule.findMany({
      where: {
        status: 'PENDING',
        scheduledAt: { lte: now },
      },
      include: {
        blog: {
          select: { id: true, userId: true, status: true },
        },
      },
    });

    if (dueSchedules.length === 0) return;

    this.logger.log(`Processing ${dueSchedules.length} due schedule(s)`);

    for (const schedule of dueSchedules) {
      try {
        // Mark as processing (set to PUBLISHED optimistically to prevent double-processing)
        await this.prisma.schedule.update({
          where: { id: schedule.id },
          data: { status: 'PUBLISHED' },
        });

        // Queue the publish job
        const job = await this.publishQueue.add(
          'publish-blog',
          {
            blogId: schedule.blogId,
            userId: schedule.blog.userId,
            scheduleId: schedule.id,
          },
          {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
            removeOnComplete: 100,
            removeOnFail: 50,
          },
        );

        this.logger.log(
          `Queued publish job ${job.id} for scheduled blog ${schedule.blogId}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to queue schedule ${schedule.id}: ${(error as Error).message}`,
        );

        // Reset to PENDING so it will retry next minute
        await this.prisma.schedule.update({
          where: { id: schedule.id },
          data: {
            status: 'FAILED',
            errorMessage: (error as Error).message,
          },
        }).catch(() => {});
      }
    }
  }
}
