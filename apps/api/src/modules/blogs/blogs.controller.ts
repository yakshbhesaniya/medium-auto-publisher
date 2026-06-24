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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('blogs')
@ApiBearerAuth('JWT-auth')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all blogs (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'mode', required: false, type: String })
  @ApiQuery({ name: 'tone', required: false, type: String })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('mode') mode?: string,
    @Query('tone') tone?: string,
  ) {
    return this.blogsService.findAll(userId, { page, limit, search, status, mode, tone });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single blog by ID' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<any> {
    return this.blogsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new blog' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateBlogDto): Promise<any> {
    return this.blogsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateBlogDto,
  ): Promise<any> {
    return this.blogsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a blog' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blogsService.remove(id, userId);
  }

  @Get(':id/versions')
  @ApiOperation({ summary: 'Get all versions of a blog' })
  async getVersions(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blogsService.getVersions(id, userId);
  }

  @Post(':id/versions/:versionId/restore')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restore a blog to a specific version' })
  async restoreVersion(
    @CurrentUser('id') userId: string,
    @Param('id') blogId: string,
    @Param('versionId') versionId: string,
  ): Promise<any> {
    return this.blogsService.restoreVersion(blogId, versionId, userId);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Publish blog to Medium immediately' })
  async publish(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blogsService.triggerPublish(id, userId);
  }

  @Post(':id/schedule')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Schedule blog for future publication' })
  async schedule(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() body: { scheduledAt: string },
  ) {
    return this.blogsService.createSchedule(id, userId, body.scheduledAt);
  }

  @Post(':id/humanize')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Re-run humanization pipeline on blog content' })
  async humanize(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blogsService.triggerHumanize(id, userId);
  }

  @Post(':id/generate-image')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Re-generate cover image for blog' })
  async generateImage(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.blogsService.triggerGenerateCoverImage(id, userId);
  }
}
