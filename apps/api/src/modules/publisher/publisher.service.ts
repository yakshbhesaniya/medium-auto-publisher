import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { MediumPublishResponse } from '@medium-publisher/types';
import axios, { AxiosError } from 'axios';

const MEDIUM_API_BASE = 'https://api.medium.com/v1';

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly analyticsService: AnalyticsService,
  ) {}

  async publishToMedium(blogId: string, userId: string): Promise<MediumPublishResponse> {
    // 1. Get blog
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, userId },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${blogId}" not found`);
    }

    if (!blog.markdownContent && !blog.content) {
      throw new BadRequestException('Blog has no content to publish');
    }

    if (blog.status === 'PUBLISHED') {
      throw new BadRequestException('Blog is already published');
    }

    // 2. Get user's Medium token (decrypt from DB)
    const mediumToken = await this.usersService.getMediumToken(userId);

    if (!mediumToken) {
      throw new BadRequestException(
        'No Medium integration token found. Please add your Medium token in settings.',
      );
    }

    // 3. Get Medium user ID
    let mediumUserId: string;
    let mediumUsername: string;

    try {
      const meResponse = await axios.get(`${MEDIUM_API_BASE}/me`, {
        headers: {
          Authorization: `Bearer ${mediumToken}`,
          'Content-Type': 'application/json',
        },
      });

      mediumUserId = meResponse.data.data.id;
      mediumUsername = meResponse.data.data.username;
    } catch (err) {
      const error = err as AxiosError;
      this.logger.error(`Failed to get Medium user info: ${error.message}`);
      throw new BadRequestException(
        'Failed to authenticate with Medium API. Please check your integration token.',
      );
    }

    // 4. Publish post to Medium
    let mediumResponse: MediumPublishResponse;

    try {
      const publishPayload = {
        title: blog.title,
        contentFormat: 'markdown',
        content: blog.markdownContent || blog.content,
        tags: blog.tags.slice(0, 5), // Medium allows max 5 tags
        publishStatus: 'public',
        ...(blog.metaDescription && { canonicalUrl: undefined }),
      };

      const response = await axios.post(
        `${MEDIUM_API_BASE}/users/${mediumUserId}/posts`,
        publishPayload,
        {
          headers: {
            Authorization: `Bearer ${mediumToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      mediumResponse = response.data.data;
    } catch (err) {
      const error = err as AxiosError;
      const errorData = error.response?.data as any;
      this.logger.error(`Failed to publish to Medium: ${JSON.stringify(errorData || error.message)}`);

      // Update blog status to FAILED
      await this.prisma.blog.update({
        where: { id: blogId },
        data: { status: 'FAILED' },
      });

      throw new InternalServerErrorException(
        errorData?.errors?.[0]?.message || 'Failed to publish to Medium. Please try again.',
      );
    }

    // 5. Save PublishedPost record
    await this.prisma.publishedPost.upsert({
      where: { blogId },
      create: {
        blogId,
        mediumId: mediumResponse.id,
        mediumUrl: mediumResponse.url,
        platform: 'MEDIUM',
        publishedAt: new Date(),
      },
      update: {
        mediumId: mediumResponse.id,
        mediumUrl: mediumResponse.url,
        publishedAt: new Date(),
      },
    });

    // 6. Update blog status to PUBLISHED
    await this.prisma.blog.update({
      where: { id: blogId },
      data: { status: 'PUBLISHED' },
    });

    // 7. Update user's Medium info
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        mediumUserId,
        mediumUsername,
      },
    });

    // 8. Create initial analytics entry
    await this.analyticsService.createInitialAnalytics(blogId);

    this.logger.log(
      `Blog "${blog.title}" published to Medium: ${mediumResponse.url}`,
    );

    return mediumResponse;
  }

  async getPublishStatus(blogId: string, userId: string) {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, userId },
      select: {
        id: true,
        title: true,
        status: true,
        publishedPost: {
          select: {
            mediumId: true,
            mediumUrl: true,
            publishedAt: true,
            platform: true,
          },
        },
      },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${blogId}" not found`);
    }

    return blog;
  }
}
