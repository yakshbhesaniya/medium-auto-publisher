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
import { TopicsService } from './topics.service';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('topics')
@ApiBearerAuth('JWT-auth')
@Controller('topics')
export class TopicsController {
  constructor(private readonly topicsService: TopicsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all topics (paginated, filterable)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'category', required: false, type: String })
  @ApiQuery({ name: 'isTrending', required: false, type: Boolean })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('category') category?: string,
    @Query('isTrending') isTrending?: boolean,
  ) {
    return this.topicsService.findAll(userId, { page, limit, search, status, category, isTrending });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single topic by ID' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<any> {
    return this.topicsService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new topic' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateTopicDto) {
    return this.topicsService.create(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a topic' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTopicDto,
  ) {
    return this.topicsService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a topic' })
  async remove(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.topicsService.remove(id, userId);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: 'Approve a topic' })
  async approve(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.topicsService.approve(id, userId);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: 'Reject a topic' })
  async reject(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.topicsService.reject(id, userId);
  }

  @Post(':id/research')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger AI research for a topic' })
  async triggerResearch(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.topicsService.triggerResearch(id, userId);
  }

  @Post(':id/generate')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Trigger blog generation for a topic' })
  async triggerGeneration(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() options: { mode?: string; tone?: string; blogId?: string },
  ) {
    return this.topicsService.triggerBlogGeneration(id, userId, options);
  }

  @Post(':id/generate-proposed')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Generate a specific proposed blog from the AI plan' })
  async generateProposedBlog(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: { proposedBlogIndex: number; mode?: string; tone?: string },
  ) {
    return this.topicsService.generateProposedBlog(id, userId, dto.proposedBlogIndex, { mode: dto.mode, tone: dto.tone });
  }
}
