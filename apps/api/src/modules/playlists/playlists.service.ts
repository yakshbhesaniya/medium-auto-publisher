import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePlaylistDto, UpdatePlaylistDto } from './dto/playlist.dto';

@Injectable()
export class PlaylistsService {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [playlists, total] = await this.prisma.$transaction([
      this.prisma.playlist.findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          blogs: {
            include: {
              blog: {
                select: {
                  id: true,
                  title: true,
                  readTimeMinutes: true,
                  coverImageUrl: true,
                  status: true,
                },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.playlist.count({ where: { userId } }),
    ]);

    return {
      playlists,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, userId: string) {
    const playlist = await this.prisma.playlist.findFirst({
      where: { id, userId },
      include: {
        blogs: {
          include: {
            blog: {
              select: {
                id: true,
                title: true,
                subtitle: true,
                slug: true,
                readTimeMinutes: true,
                coverImageUrl: true,
                status: true,
                tags: true,
              },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${id}" not found`);
    }

    return playlist;
  }

  async create(userId: string, dto: CreatePlaylistDto) {
    return this.prisma.playlist.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        coverImage: dto.coverImage,
        userId,
      },
    });
  }

  async update(id: string, userId: string, dto: UpdatePlaylistDto) {
    await this.findOne(id, userId);

    return this.prisma.playlist.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.coverImage !== undefined && { coverImage: dto.coverImage }),
        ...(dto.isPublished !== undefined && { isPublished: dto.isPublished }),
      },
    });
  }

  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.playlist.delete({ where: { id } });
    return { message: 'Playlist deleted successfully' };
  }

  async addBlog(playlistId: string, blogId: string, userId: string, order?: number) {
    await this.findOne(playlistId, userId);

    // Verify blog belongs to user
    const blog = await this.prisma.blog.findFirst({
      where: { id: blogId, userId },
      select: { id: true, readTimeMinutes: true },
    });

    if (!blog) {
      throw new NotFoundException(`Blog with ID "${blogId}" not found`);
    }

    const existing = await this.prisma.playlistBlog.findFirst({
      where: { playlistId, blogId },
    });

    if (existing) {
      throw new ConflictException('Blog is already in this playlist');
    }

    // Determine order if not provided
    if (order === undefined) {
      const maxOrder = await this.prisma.playlistBlog.aggregate({
        where: { playlistId },
        _max: { order: true },
      });
      order = (maxOrder._max.order ?? -1) + 1;
    }

    const playlistBlog = await this.prisma.playlistBlog.create({
      data: { playlistId, blogId, order },
    });

    await this.recalculateTotalReadTime(playlistId);

    return playlistBlog;
  }

  async removeBlog(playlistId: string, blogId: string, userId: string) {
    await this.findOne(playlistId, userId);

    const entry = await this.prisma.playlistBlog.findFirst({
      where: { playlistId, blogId },
    });

    if (!entry) {
      throw new NotFoundException('Blog not found in this playlist');
    }

    await this.prisma.playlistBlog.delete({ where: { id: entry.id } });
    await this.recalculateTotalReadTime(playlistId);

    return { message: 'Blog removed from playlist' };
  }

  async reorderBlogs(playlistId: string, orderedBlogIds: string[], userId: string) {
    await this.findOne(playlistId, userId);

    if (!orderedBlogIds.length) {
      throw new BadRequestException('orderedBlogIds must not be empty');
    }

    // Update order for each blog in a transaction
    await this.prisma.$transaction(
      orderedBlogIds.map((blogId, index) =>
        this.prisma.playlistBlog.updateMany({
          where: { playlistId, blogId },
          data: { order: index },
        }),
      ),
    );

    return this.findOne(playlistId, userId);
  }

  async calculateTotalReadTime(playlistId: string): Promise<number> {
    const blogs = await this.prisma.playlistBlog.findMany({
      where: { playlistId },
      include: { blog: { select: { readTimeMinutes: true } } },
    });

    return blogs.reduce((sum, pb) => sum + (pb.blog.readTimeMinutes || 0), 0);
  }

  private async recalculateTotalReadTime(playlistId: string) {
    const totalReadTime = await this.calculateTotalReadTime(playlistId);
    await this.prisma.playlist.update({
      where: { id: playlistId },
      data: { totalReadTime },
    });
  }
}
