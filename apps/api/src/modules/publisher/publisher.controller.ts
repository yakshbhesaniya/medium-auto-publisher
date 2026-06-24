import {
  Controller,
  Post,
  Get,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PublisherService } from './publisher.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('publisher')
@ApiBearerAuth('JWT-auth')
@Controller('publisher')
export class PublisherController {
  constructor(private readonly publisherService: PublisherService) {}

  @Post('medium/:blogId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Publish a blog to Medium immediately' })
  @ApiResponse({ status: 200, description: 'Blog published successfully' })
  @ApiResponse({ status: 400, description: 'No Medium token set or blog already published' })
  @ApiResponse({ status: 404, description: 'Blog not found' })
  async publishToMedium(
    @CurrentUser('id') userId: string,
    @Param('blogId') blogId: string,
  ) {
    return this.publisherService.publishToMedium(blogId, userId);
  }

  @Get('medium/status/:blogId')
  @ApiOperation({ summary: 'Get Medium publish status for a blog' })
  @ApiResponse({ status: 200, description: 'Publish status returned' })
  async getPublishStatus(
    @CurrentUser('id') userId: string,
    @Param('blogId') blogId: string,
  ) {
    return this.publisherService.getPublishStatus(blogId, userId);
  }
}
