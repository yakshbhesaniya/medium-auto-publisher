import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TopicSource, TopicStatus } from '@medium-publisher/types';

export class UpdateTopicDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['AI', 'machine learning'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];

  @ApiPropertyOptional({ enum: ['MANUAL', 'GOOGLE_TRENDS', 'REDDIT', 'HACKER_NEWS', 'TWITTER', 'DEV_TO', 'RSS'] })
  @IsOptional()
  @IsEnum(['MANUAL', 'GOOGLE_TRENDS', 'REDDIT', 'HACKER_NEWS', 'TWITTER', 'DEV_TO', 'RSS'])
  source?: TopicSource;

  @ApiPropertyOptional({ enum: ['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'] })
  @IsOptional()
  @IsEnum(['PENDING', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED'])
  status?: TopicStatus;
}
