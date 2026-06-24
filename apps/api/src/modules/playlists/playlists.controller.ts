import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import {
  CreatePlaylistDto,
  UpdatePlaylistDto,
  AddBlogToPlaylistDto,
  ReorderBlogsDto,
} from './dto/playlist.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('playlists')
@ApiBearerAuth('JWT-auth')
@Controller('playlists')
export class PlaylistsController {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all playlists' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.playlistsService.findAll(userId, Number(page) || 1, Number(limit) || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single playlist by ID' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.playlistsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new playlist' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreatePlaylistDto) {
    return this.playlistsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a playlist' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePlaylistDto,
  ) {
    return this.playlistsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a playlist' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.playlistsService.remove(id, userId);
  }

  @Post(':id/blogs')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a blog to a playlist' })
  async addBlog(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Body() dto: AddBlogToPlaylistDto,
  ) {
    return this.playlistsService.addBlog(playlistId, dto.blogId, userId, dto.order);
  }

  @Delete(':id/blogs/:blogId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a blog from a playlist' })
  async removeBlog(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Param('blogId') blogId: string,
  ) {
    return this.playlistsService.removeBlog(playlistId, blogId, userId);
  }

  @Patch(':id/reorder')
  @ApiOperation({ summary: 'Reorder blogs within a playlist' })
  async reorderBlogs(
    @CurrentUser('id') userId: string,
    @Param('id') playlistId: string,
    @Body() dto: ReorderBlogsDto,
  ) {
    return this.playlistsService.reorderBlogs(playlistId, dto.orderedBlogIds, userId);
  }
}
