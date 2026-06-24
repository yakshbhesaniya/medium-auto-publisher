import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Blog ID to schedule' })
  @IsString()
  blogId: string;

  @ApiProperty({ description: 'ISO date string for when to publish', example: '2025-01-15T10:00:00Z' })
  @IsDateString()
  scheduledAt: string;
}
