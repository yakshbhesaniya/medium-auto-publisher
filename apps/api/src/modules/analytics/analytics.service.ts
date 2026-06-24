import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DashboardStats,
  DashboardChartData,
  ChartDataPoint,
  PieChartData,
  TopBlogData,
} from '@medium-publisher/types';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats(userId: string): Promise<DashboardStats> {
    const [
      totalBlogs,
      draftBlogs,
      publishedBlogs,
      scheduledBlogs,
      analyticsAgg,
    ] = await Promise.all([
      this.prisma.blog.count({ where: { userId } }),
      this.prisma.blog.count({ where: { userId, status: 'DRAFT' } }),
      this.prisma.blog.count({ where: { userId, status: 'PUBLISHED' } }),
      this.prisma.blog.count({ where: { userId, status: 'SCHEDULED' } }),
      this.prisma.analytics.aggregate({
        where: { blog: { userId } },
        _sum: { views: true, reads: true, earnings: true },
        _avg: { readRatio: true },
      }),
    ]);

    return {
      totalBlogs,
      draftBlogs,
      publishedBlogs,
      scheduledBlogs,
      totalViews: analyticsAgg._sum.views || 0,
      totalReads: analyticsAgg._sum.reads || 0,
      totalEarnings: analyticsAgg._sum.earnings || 0,
      avgReadRatio: Math.round((analyticsAgg._avg.readRatio || 0) * 100) / 100,
    };
  }

  async getDashboardCharts(userId: string): Promise<DashboardChartData> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    // Daily views — last 30 days
    const dailyViewsRaw = await this.prisma.analytics.groupBy({
      by: ['date'],
      where: {
        blog: { userId },
        date: { gte: thirtyDaysAgo },
      },
      _sum: { views: true },
      orderBy: { date: 'asc' },
    });

    const dailyViews: ChartDataPoint[] = dailyViewsRaw.map((r) => ({
      date: r.date.toISOString().split('T')[0],
      value: r._sum.views || 0,
    }));

    // Monthly earnings — last 12 months (aggregated by month)
    const monthlyEarningsRaw = await this.prisma.analytics.findMany({
      where: {
        blog: { userId },
        date: { gte: twelveMonthsAgo },
      },
      select: { earnings: true, date: true },
      orderBy: { date: 'asc' },
    });

    const earningsByMonth = new Map<string, number>();
    for (const entry of monthlyEarningsRaw) {
      const monthKey = `${entry.date.getFullYear()}-${String(entry.date.getMonth() + 1).padStart(2, '0')}`;
      earningsByMonth.set(monthKey, (earningsByMonth.get(monthKey) || 0) + entry.earnings);
    }

    const monthlyEarnings: ChartDataPoint[] = Array.from(earningsByMonth.entries()).map(
      ([date, value]) => ({ date, value: Math.round(value * 100) / 100 }),
    );

    // Blogs by status (pie chart)
    const statusCounts = await this.prisma.blog.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    });

    const statusColors: Record<string, string> = {
      DRAFT: '#6B7280',
      RESEARCHING: '#3B82F6',
      GENERATING: '#8B5CF6',
      HUMANIZING: '#EC4899',
      REVIEW: '#F59E0B',
      SCHEDULED: '#14B8A6',
      PUBLISHED: '#10B981',
      FAILED: '#EF4444',
    };

    const blogsByStatus: PieChartData[] = statusCounts.map((s) => ({
      name: s.status,
      value: s._count.status,
      color: statusColors[s.status] || '#9CA3AF',
    }));

    // Top 5 blogs by views
    const topBlogsRaw = await this.prisma.blog.findMany({
      where: { userId, status: 'PUBLISHED' },
      include: {
        analytics: {
          select: { views: true, earnings: true, readRatio: true },
        },
      },
      take: 10,
    });

    const topBlogsWithStats = topBlogsRaw
      .map((blog) => ({
        id: blog.id,
        title: blog.title,
        views: blog.analytics.reduce((s, a) => s + a.views, 0),
        earnings: blog.analytics.reduce((s, a) => s + a.earnings, 0),
        readRatio:
          blog.analytics.length
            ? blog.analytics.reduce((s, a) => s + a.readRatio, 0) / blog.analytics.length
            : 0,
      }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 5);

    const topBlogs: TopBlogData[] = topBlogsWithStats;

    return { dailyViews, monthlyEarnings, blogsByStatus, topBlogs };
  }

  async getBlogAnalytics(blogId: string, userId: string) {
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, userId },
      select: { id: true, title: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${blogId}" not found`);
    }

    const analytics = await this.prisma.analytics.findMany({
      where: { blogId },
      orderBy: { date: 'desc' },
    });

    const totals = analytics.reduce(
      (acc, a) => ({
        views: acc.views + a.views,
        reads: acc.reads + a.reads,
        claps: acc.claps + a.claps,
        earnings: acc.earnings + a.earnings,
        followers: Math.max(acc.followers, a.followers),
      }),
      { views: 0, reads: 0, claps: 0, earnings: 0, followers: 0 },
    );

    return {
      blog,
      analytics,
      totals,
      avgReadRatio:
        analytics.length
          ? analytics.reduce((s, a) => s + a.readRatio, 0) / analytics.length
          : 0,
    };
  }

  async upsertAnalytics(
    blogId: string,
    data: {
      views?: number;
      reads?: number;
      readRatio?: number;
      claps?: number;
      followers?: number;
      earnings?: number;
      date?: Date;
    },
  ) {
    const date = data.date || new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    // Check for existing entry on same day
    const existing = await this.prisma.analytics.findFirst({
      where: {
        blogId,
        date: { gte: dateOnly, lt: new Date(dateOnly.getTime() + 86400000) },
      },
    });

    if (existing) {
      return this.prisma.analytics.update({
        where: { id: existing.id },
        data: {
          ...(data.views !== undefined && { views: data.views }),
          ...(data.reads !== undefined && { reads: data.reads }),
          ...(data.readRatio !== undefined && { readRatio: data.readRatio }),
          ...(data.claps !== undefined && { claps: data.claps }),
          ...(data.followers !== undefined && { followers: data.followers }),
          ...(data.earnings !== undefined && { earnings: data.earnings }),
        },
      });
    }

    return this.prisma.analytics.create({
      data: {
        blogId,
        views: data.views || 0,
        reads: data.reads || 0,
        readRatio: data.readRatio || 0,
        claps: data.claps || 0,
        followers: data.followers || 0,
        earnings: data.earnings || 0,
        date: dateOnly,
      },
    });
  }

  async createInitialAnalytics(blogId: string) {
    const existing = await this.prisma.analytics.findFirst({ where: { blogId } });
    if (existing) return existing;

    return this.prisma.analytics.create({
      data: {
        blogId,
        views: 0,
        reads: 0,
        readRatio: 0,
        claps: 0,
        followers: 0,
        earnings: 0,
        date: new Date(),
      },
    });
  }
}
