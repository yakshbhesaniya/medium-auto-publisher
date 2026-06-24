import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bullmq';
import slugify from 'slugify';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

export interface BlogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  mode?: string;
  tone?: string;
}

@Injectable()
export class BlogsService {
  private readonly logger = new Logger(BlogsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue('blog-gen-queue') private readonly blogGenQueue: Queue,
    @InjectQueue('publish-queue') private readonly publishQueue: Queue,
  ) {}

  async findAll(userId: string, query: BlogListQuery) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const where: any = { userId };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { metaDescription: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.mode) where.mode = query.mode;
    if (query.tone) where.tone = query.tone;

    const [blogs, total] = await this.prisma.$transaction([
      this.prisma.blog.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          title: true,
          subtitle: true,
          slug: true,
          status: true,
          mode: true,
          tone: true,
          wordCount: true,
          readTimeMinutes: true,
          coverImageUrl: true,
          tags: true,
          category: true,
          createdAt: true,
          updatedAt: true,
          publishedPost: { select: { mediumUrl: true, publishedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.blog.count({ where }),
    ]);

    return {
      blogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string): Promise<any> {
    const blog = await this.prisma.blog.findFirst({
      where: { id, userId },
      include: {
        topic: { select: { id: true, title: true, status: true } },
        publishedPost: true,
        analytics: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${id}" not found`);
    }

    return blog;
  }

  async create(userId: string, dto: CreateBlogDto): Promise<any> {
    const title = dto.title || `Untitled Blog - ${new Date().toISOString()}`;
    const slug = await this.generateUniqueSlug(title);

    return this.prisma.blog.create({
      data: {
        title,
        slug,
        content: '',
        markdownContent: '',
        mode: dto.mode || 'TECHNICAL_DEEP_DIVE',
        tone: dto.tone || 'PROFESSIONAL',
        tags: dto.tags || [],
        category: dto.category,
        focusKeyword: dto.focusKeyword,
        topicId: dto.topicId,
        userId,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdateBlogDto): Promise<any> {
    const blog = await this.findOne(id, userId);

    // Auto-update metrics if content changes
    let wordCount = blog.wordCount;
    let readTimeMinutes = blog.readTimeMinutes;

    if (dto.markdownContent) {
      wordCount = dto.markdownContent.trim().split(/\s+/).length;
      readTimeMinutes = Math.ceil(wordCount / 200);
    }

    // Versioning: save current version before update
    if (dto.content || dto.markdownContent) {
      await this.saveVersion(id, userId, 'Manual edit');
    }

    return this.prisma.blog.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.subtitle !== undefined && { subtitle: dto.subtitle }),
        ...(dto.content !== undefined && { content: dto.content }),
        ...(dto.markdownContent !== undefined && {
          markdownContent: dto.markdownContent,
          wordCount,
          readTimeMinutes,
        }),
        ...(dto.metaDescription !== undefined && { metaDescription: dto.metaDescription }),
        ...(dto.tags !== undefined && { tags: dto.tags }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.mode !== undefined && { mode: dto.mode }),
        ...(dto.tone !== undefined && { tone: dto.tone }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.focusKeyword !== undefined && { focusKeyword: dto.focusKeyword }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.blog.delete({ where: { id } });
    return { message: 'Blog deleted successfully' };
  }

  async saveVersion(blogId: string, userId: string, changeNote?: string) {
    const blog = await this.findOne(blogId, userId);

    if (!blog.content && !blog.markdownContent) return null;

    const lastVersion = await this.prisma.blogVersion.findFirst({
      where: { blogId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const nextVersion = (lastVersion?.version || 0) + 1;

    return this.prisma.blogVersion.create({
      data: {
        blogId,
        content: blog.content,
        markdownContent: blog.markdownContent,
        version: nextVersion,
        changeNote,
        wordCount: blog.wordCount,
      },
    });
  }

  async getVersions(blogId: string, userId: string) {
    await this.findOne(blogId, userId);

    return this.prisma.blogVersion.findMany({
      where: { blogId },
      orderBy: { version: 'desc' },
      select: {
        id: true,
        version: true,
        changeNote: true,
        wordCount: true,
        createdAt: true,
      },
    });
  }

  async restoreVersion(blogId: string, versionId: string, userId: string): Promise<any> {
    const blog = await this.findOne(blogId, userId);

    const version = await this.prisma.blogVersion.findFirst({
      where: { id: versionId, blogId },
    });

    if (!version) {
      throw new NotFoundException(`Version "${versionId}" not found for this blog`);
    }

    // Save current state before restoring
    await this.saveVersion(blogId, userId, `Before restore to version ${version.version}`);

    return this.prisma.blog.update({
      where: { id: blogId },
      data: {
        content: version.content,
        markdownContent: version.markdownContent,
        wordCount: version.wordCount,
        readTimeMinutes: Math.ceil(version.wordCount / 200),
        status: 'REVIEW',
      },
    });
  }

  async triggerPublish(blogId: string, userId: string) {
    const blog = await this.findOne(blogId, userId);

    if (blog.status === 'PUBLISHED') {
      throw new BadRequestException('Blog is already published');
    }

    if (!blog.content) {
      throw new BadRequestException('Blog has no content to publish');
    }

    const job = await this.publishQueue.add(
      'publish-blog',
      { blogId, userId },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Publish job ${job.id} queued for blog ${blogId}`);
    return { message: 'Publishing started', jobId: job.id };
  }

  async triggerHumanize(blogId: string, userId: string) {
    const blog = await this.findOne(blogId, userId);

    if (!blog.content) {
      throw new BadRequestException('Blog has no content to humanize');
    }

    const job = await this.blogGenQueue.add(
      'humanize-blog',
      { blogId, userId },
      { attempts: 2, removeOnComplete: 100 },
    );

    return { message: 'Humanization started', jobId: job.id };
  }

  async triggerGenerateCoverImage(blogId: string, userId: string) {
    const blog = await this.findOne(blogId, userId);

    const job = await this.blogGenQueue.add(
      'generate-cover-image',
      { blogId, userId, title: blog.title },
      { attempts: 2, removeOnComplete: 100 },
    );

    return { message: 'Cover image generation started', jobId: job.id };
  }

  async createSchedule(blogId: string, userId: string, scheduledAt: string) {
    const blog = await this.findOne(blogId, userId);

    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      throw new BadRequestException('Scheduled time must be in the future');
    }

    const schedule = await this.prisma.schedule.create({
      data: {
        blogId,
        scheduledAt: scheduledDate,
        status: 'PENDING',
      },
    });

    await this.prisma.blog.update({
      where: { id: blogId },
      data: { status: 'SCHEDULED' },
    });

    return schedule;
  }

  async updateMetrics(blogId: string, metrics: {
    wordCount?: number;
    readTimeMinutes?: number;
    aiProbabilityScore?: number;
    burstinessScore?: number;
    lexicalRichness?: number;
    readabilityScore?: number;
    complexityScore?: number;
  }): Promise<any> {
    return this.prisma.blog.update({
      where: { id: blogId },
      data: metrics,
    });
  }

  private async generateUniqueSlug(title: string): Promise<string> {
    let slug = slugify(title, { lower: true, strict: true });
    let counter = 0;

    while (true) {
      const candidateSlug = counter === 0 ? slug : `${slug}-${counter}`;
      const existing = await this.prisma.blog.findUnique({
        where: { slug: candidateSlug },
        select: { id: true },
      });
      if (!existing) return candidateSlug;
      counter++;
    }
  }
}
