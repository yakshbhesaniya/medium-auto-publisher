import { Injectable, Logger } from '@nestjs/common';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PrismaService } from '../prisma/prisma.service';
import { BlogPipeline, PipelineProgress } from '@medium-publisher/ai';
import { ConfigService } from '@nestjs/config';
import slugify from 'slugify';

interface BlogGenJobData {
  topicId: string;
  blogId?: string;
  mode: string;
  tone: string;
  userId: string;
}

interface HumanizeJobData {
  blogId: string;
  userId: string;
}

interface CoverImageJobData {
  blogId: string;
  userId: string;
  title: string;
}

@Processor('blog-gen-queue')
@Injectable()
export class BlogGenWorker {
  private readonly logger = new Logger(BlogGenWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  @Process('generate-blog')
  async handleBlogGeneration(job: Job<BlogGenJobData>) {
    const { topicId, blogId, mode, tone, userId } = job.data;
    this.logger.log(`Processing blog generation job ${job.id} for topic ${topicId}`);

    let targetBlogId = blogId;

    try {
      // 1. Get topic with research
      const topic = await this.prisma.topic.findFirst({
        where: { id: topicId, userId },
        include: { research: true },
      });

      if (!topic) throw new Error(`Topic ${topicId} not found`);
      if (!topic.research) throw new Error(`Topic ${topicId} has no research`);

      await job.progress(5);

      // 2. Create or find the blog record
      if (!targetBlogId) {
        const slug = await this.generateUniqueSlug(topic.title);
        const newBlog = await this.prisma.blog.create({
          data: {
            title: topic.title,
            slug,
            content: '',
            markdownContent: '',
            mode: mode as any,
            tone: tone as any,
            status: 'GENERATING',
            topicId,
            userId,
          },
        });
        targetBlogId = newBlog.id;
      } else {
        await this.prisma.blog.update({
          where: { id: targetBlogId },
          data: { status: 'GENERATING' },
        });
      }

      await job.progress(10);

      // 3. Progress callback — updates blog stage in DB
      const onProgress = async (progress: PipelineProgress) => {
        await this.prisma.blog.update({
          where: { id: targetBlogId },
          data: {
            status: this.stageToStatus(progress.stage) as any,
          },
        });
        await job.progress(progress.progress);
        this.logger.debug(
          `[Job ${job.id}] ${progress.stage} (${progress.progress}%): ${progress.message}`,
        );
      };

      // 4. Run BlogPipeline
      const pipeline = new BlogPipeline(onProgress);
      const result = await pipeline.run(
        topic as any,
        mode as any,
        tone as any,
        true,
      );

      await job.progress(97);

      // 5. Save final blog content and metrics
      await this.prisma.blog.update({
        where: { id: targetBlogId },
        data: {
          title: result.title,
          subtitle: result.subtitle,
          slug: result.slug || (await this.generateUniqueSlug(result.title)),
          markdownContent: result.markdownContent,
          content: result.markdownContent, // store same as HTML for now
          metaDescription: result.metaDescription,
          tags: result.tags,
          focusKeyword: result.focusKeyword,
          outline: result.outline as any,
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
          status: 'REVIEW',
        },
      });

      // 6. Save research to DB if not already saved
      await this.prisma.research.upsert({
        where: { topicId },
        create: {
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
        update: {},
      });

      await job.progress(100);
      this.logger.log(
        `Blog generation completed for blog ${targetBlogId} — ${result.wordCount} words`,
      );

      return { blogId: targetBlogId, status: 'completed', wordCount: result.wordCount };
    } catch (error) {
      this.logger.error(
        `Blog gen job ${job.id} failed: ${(error as Error).message}`,
        (error as Error).stack,
      );

      if (targetBlogId) {
        await this.prisma.blog.update({
          where: { id: targetBlogId },
          data: { status: 'FAILED' },
        }).catch(() => {});
      }

      throw error;
    }
  }

  @Process('humanize-blog')
  async handleHumanize(job: Job<HumanizeJobData>) {
    const { blogId, userId } = job.data;
    this.logger.log(`Processing humanize job ${job.id} for blog ${blogId}`);

    try {
      const blog = await this.prisma.blog.findFirst({
        where: { id: blogId, userId },
        select: { id: true, title: true, markdownContent: true, topicId: true, mode: true, tone: true },
      });

      if (!blog) throw new Error(`Blog ${blogId} not found`);
      if (!blog.markdownContent) throw new Error('Blog has no content to humanize');

      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: 'HUMANIZING' },
      });

      await job.progress(10);

      // Run just the humanizer via pipeline stage
      const { HumanizerAgent, AnthropicProvider } = await import('@medium-publisher/ai');
      const claude = new AnthropicProvider(
        this.configService.get<string>('AI_WRITING_MODEL', 'claude-sonnet-4-5'),
      );
      const humanizer = new HumanizerAgent(claude);
      const { content: humanizedContent, metrics } = await humanizer.humanize(
        blog.markdownContent,
        2,
      );

      await job.progress(90);

      await this.prisma.blog.update({
        where: { id: blogId },
        data: {
          markdownContent: humanizedContent,
          content: humanizedContent,
          aiProbabilityScore: metrics.aiProbabilityScore,
          burstinessScore: metrics.burstinessScore,
          lexicalRichness: metrics.lexicalRichness,
          readabilityScore: metrics.readabilityScore,
          wordCount: metrics.wordCount,
          readTimeMinutes: metrics.readTimeMinutes,
          status: 'REVIEW',
        },
      });

      await job.progress(100);
      this.logger.log(`Humanization completed for blog ${blogId} — AI score: ${metrics.aiProbabilityScore}`);

      return { blogId, aiScore: metrics.aiProbabilityScore };
    } catch (error) {
      this.logger.error(
        `Humanize job ${job.id} failed for blog ${blogId}: ${(error as Error).message}`,
      );
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: 'REVIEW' },
      }).catch(() => {});
      throw error;
    }
  }

  @Process('generate-cover-image')
  async handleCoverImage(job: Job<CoverImageJobData>) {
    const { blogId, userId, title } = job.data;
    this.logger.log(`Processing cover image job ${job.id} for blog ${blogId}`);

    try {
      const blog = await this.prisma.blog.findFirst({
        where: { id: blogId, userId },
        select: { id: true, title: true, tags: true, markdownContent: true },
      });

      if (!blog) throw new Error(`Blog ${blogId} not found`);

      await job.progress(10);

      const { ImageAgent, OpenAIProvider } = await import('@medium-publisher/ai');
      const openai = new OpenAIProvider(
        this.configService.get<string>('AI_FAST_MODEL', 'gpt-4o'),
      );
      const imageAgent = new ImageAgent(openai);

      const description = blog.markdownContent?.slice(0, 200) || blog.title;
      const imageResult = await imageAgent.generateCoverImages(
        blog.title,
        description,
        blog.tags,
      );

      await job.progress(90);

      await this.prisma.blog.update({
        where: { id: blogId },
        data: {
          coverImageUrl: imageResult.imageUrls[0] || null,
          coverImagePrompts: imageResult.prompts as any,
          coverImageVariants: imageResult.imageUrls as any,
        },
      });

      await job.progress(100);
      this.logger.log(`Cover image generated for blog ${blogId}: ${imageResult.imageUrls[0]}`);

      return { blogId, coverImageUrl: imageResult.imageUrls[0] };
    } catch (error) {
      this.logger.error(
        `Cover image job ${job.id} failed for blog ${blogId}: ${(error as Error).message}`,
      );
      throw error;
    }
  }

  private stageToStatus(stage: string): string {
    const map: Record<string, string> = {
      research: 'RESEARCHING',
      outline: 'GENERATING',
      writing: 'GENERATING',
      humanizing: 'HUMANIZING',
      editing: 'HUMANIZING',
      seo: 'GENERATING',
      cover_image: 'GENERATING',
      complete: 'REVIEW',
    };
    return map[stage] || 'GENERATING';
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
