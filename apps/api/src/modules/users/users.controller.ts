import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateMediumTokenDto } from './dto/update-user.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile returned' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Patch('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  async updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(userId, dto);
  }

  @Patch('me/medium-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Save Medium API integration token (stored encrypted)' })
  @ApiResponse({ status: 200, description: 'Medium token saved' })
  async updateMediumToken(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMediumTokenDto,
  ) {
    await this.usersService.updateMediumToken(userId, dto.mediumToken);
    return { message: 'Medium token saved successfully' };
  }
}
