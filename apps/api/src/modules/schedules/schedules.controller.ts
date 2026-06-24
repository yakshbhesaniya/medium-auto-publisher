import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('schedules')
@ApiBearerAuth('JWT-auth')
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all schedules for the current user' })
  async findAll(@CurrentUser('id') userId: string) {
    return this.schedulesService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single schedule by ID' })
  async findOne(@CurrentUser('id') userId: string, @Param('id') id: string): Promise<any> {
    return this.schedulesService.findOne(id, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new schedule' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a pending schedule' })
  async cancel(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return this.schedulesService.cancel(id, userId);
  }
}
