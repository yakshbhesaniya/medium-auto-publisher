import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('analytics')
@ApiBearerAuth('JWT-auth')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary stats' })
  async getDashboardStats(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboardStats(userId);
  }

  @Get('dashboard/charts')
  @ApiOperation({ summary: 'Get dashboard chart data' })
  async getDashboardCharts(@CurrentUser('id') userId: string) {
    return this.analyticsService.getDashboardCharts(userId);
  }

  @Get('blogs/:blogId')
  @ApiOperation({ summary: 'Get analytics for a specific blog' })
  async getBlogAnalytics(
    @CurrentUser('id') userId: string,
    @Param('blogId') blogId: string,
  ) {
    return this.analyticsService.getBlogAnalytics(blogId, userId);
  }

  @Post('blogs/:blogId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update / upsert analytics data for a blog' })
  async updateBlogAnalytics(
    @CurrentUser('id') userId: string,
    @Param('blogId') blogId: string,
    @Body()
    data: {
      views?: number;
      reads?: number;
      readRatio?: number;
      claps?: number;
      followers?: number;
      earnings?: number;
      date?: string;
    },
  ) {
    return this.analyticsService.upsertAnalytics(blogId, {
      ...data,
      date: data.date ? new Date(data.date) : undefined,
    });
  }
}
