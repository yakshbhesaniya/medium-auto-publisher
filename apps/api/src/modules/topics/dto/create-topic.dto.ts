import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  MinLength,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TopicSource } from '@medium-publisher/types';

export class CreateTopicDto {
  @ApiProperty({ example: 'The Future of AI in Software Development', minLength: 5 })
  @IsString()
  @MinLength(5, { message: 'Title must be at least 5 characters long' })
  title: string;

  @ApiPropertyOptional({ example: 'An in-depth look at how AI is transforming the way we write code.' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['MANUAL', 'GOOGLE_TRENDS', 'REDDIT', 'HACKER_NEWS', 'TWITTER', 'DEV_TO', 'RSS'], default: 'MANUAL' })
  @IsOptional()
  @IsEnum(['MANUAL', 'GOOGLE_TRENDS', 'REDDIT', 'HACKER_NEWS', 'TWITTER', 'DEV_TO', 'RSS'])
  source?: TopicSource;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: ['AI', 'machine learning', 'software engineering'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  keywords?: string[];
}
