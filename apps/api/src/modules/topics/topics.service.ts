import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bull';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';



export interface TopicListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  category?: string;
  isTrending?: boolean;
}

@Injectable()
export class TopicsService {
  private readonly logger = new Logger(TopicsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('research-queue') private readonly researchQueue: Queue,
    @InjectQueue('blog-gen-queue') private readonly blogGenQueue: Queue,
    @InjectQueue('evaluation-queue') private readonly evaluationQueue: Queue,
  ) {}

  async findAll(userId: string, query: TopicListQuery): Promise<any> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' };
    }

    if (query.isTrending !== undefined) {
      where.isTrending = query.isTrending === true || String(query.isTrending) === 'true';
    }

    const [topics, total] = await this.prisma.$transaction([
      this.prisma.topic.findMany({
        where,
        skip,
        take: limit,
        include: { research: { select: { id: true, createdAt: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.topic.count({ where }),
    ]);

    return {
      topics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<any> {
    const topic = await this.prisma.topic.findFirst({
      where: { id, userId },
      include: {
        research: true,
        blogs: {
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID "${id}" not found`);
    }

    return topic;
  }

  async create(userId: string, dto: CreateTopicDto): Promise<any> {
    const topic = await this.prisma.topic.create({
      data: {
        title: dto.title,
        description: dto.description,
        source: dto.source || 'MANUAL',
        category: dto.category,
        keywords: dto.keywords || [],
        userId,
      },
    });

    // Automatically queue it for evaluation (Playlist vs Single Blog)
    await this.evaluationQueue.add('evaluate-topic', { topicId: topic.id, userId });

    return topic;
  }

  async update(id: string, userId: string, dto: UpdateTopicDto): Promise<any> {
    await this.findOne(id, userId);

    return this.prisma.topic.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.source !== undefined && { source: dto.source }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.keywords !== undefined && { keywords: dto.keywords }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.topic.delete({ where: { id } });
    return { message: 'Topic deleted successfully' };
  }

  async approve(id: string, userId: string): Promise<any> {
    await this.findOne(id, userId);
    return this.prisma.topic.update({
      where: { id },
      data: { status: 'APPROVED' },
    });
  }

  async reject(id: string, userId: string): Promise<any> {
    await this.findOne(id, userId);
    return this.prisma.topic.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
  }

  async triggerResearch(topicId: string, userId: string) {
    const topic = await this.findOne(topicId, userId);

    if (topic.status === 'IN_PROGRESS') {
      throw new BadRequestException('Research is already in progress for this topic');
    }

    await this.prisma.topic.update({
      where: { id: topicId },
      data: { status: 'IN_PROGRESS' },
    });

    const job = await this.researchQueue.add(
      'research-topic',
      { topicId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Research job ${job.id} queued for topic ${topicId}`);
    return { message: 'Research started', jobId: job.id };
  }

  async triggerBlogGeneration(
    topicId: string,
    userId: string,
    options: { mode?: string; tone?: string; blogId?: string },
  ) {
    const topic = await this.findOne(topicId, userId);

    if (!topic.research) {
      throw new BadRequestException('Topic must have research completed before generating a blog');
    }

    const job = await this.blogGenQueue.add(
      'generate-blog',
      {
        topicId,
        blogId: options.blogId,
        mode: options.mode || 'TECHNICAL_DEEP_DIVE',
        tone: options.tone || 'PROFESSIONAL',
        userId,
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Blog gen job ${job.id} queued for topic ${topicId}`);
    return { message: 'Blog generation started', jobId: job.id };
  }

  async generateProposedBlog(
    topicId: string,
    userId: string,
    blogIndex: number,
    options: { mode?: any; tone?: any },
  ) {
    const topic = await this.findOne(topicId, userId);

    if (!topic.proposedPlan || !topic.proposedPlan.blogs || !topic.proposedPlan.blogs[blogIndex]) {
      throw new BadRequestException('Invalid proposed blog index');
    }

    if (!topic.research) {
      throw new BadRequestException('Topic must be researched before generating blogs. Please trigger research first.');
    }

    const proposedBlog = topic.proposedPlan.blogs[blogIndex];
    const planType = topic.proposedPlan.type;

    const blogTitle = proposedBlog.title;
    let blog = await this.prisma.blog.findFirst({
      where: { topicId, title: blogTitle, userId },
    });

    if (!blog) {
      const slugify = (await import('slugify')).default;
      blog = await this.prisma.blog.create({
        data: {
          title: blogTitle,
          subtitle: proposedBlog.description,
          slug: slugify(blogTitle, { lower: true, strict: true }) + '-' + Date.now(),
          content: '',
          markdownContent: '',
          topicId,
          userId,
        },
      });

      if (planType === 'PLAYLIST' && topic.proposedPlan.playlistTitle) {
        let playlist = await this.prisma.playlist.findFirst({
          where: { title: topic.proposedPlan.playlistTitle, userId },
        });

        if (!playlist) {
          playlist = await this.prisma.playlist.create({
            data: {
              title: topic.proposedPlan.playlistTitle,
              userId,
            },
          });
        }

        const existingLink = await this.prisma.playlistBlog.findUnique({
          where: { playlistId_blogId: { playlistId: playlist.id, blogId: blog.id } },
        });

        if (!existingLink) {
          await this.prisma.playlistBlog.create({
            data: {
              playlistId: playlist.id,
              blogId: blog.id,
              order: blogIndex + 1,
            },
          });
        }
      }
    }

    const job = await this.blogGenQueue.add(
      'generate-blog',
      {
        topicId,
        blogId: blog.id,
        mode: options.mode || 'TECHNICAL_DEEP_DIVE',
        tone: options.tone || 'PROFESSIONAL',
        userId,
      },
      {
        attempts: 2,
        backoff: { type: 'fixed', delay: 10000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Blog gen job ${job.id} queued for proposed blog ${blog.id}`);
    return { message: 'Proposed blog generation started', jobId: job.id, blogId: blog.id };
  }
}
