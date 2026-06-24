import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlogMode, BlogTone, BlogStatus } from '@medium-publisher/types';

export class UpdateBlogDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  markdownContent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ enum: ['TECHNICAL_DEEP_DIVE', 'TUTORIAL', 'OPINION_PIECE', 'CASE_STUDY', 'THOUGHT_LEADERSHIP', 'STARTUP_ANALYSIS'] })
  @IsOptional()
  @IsEnum(['TECHNICAL_DEEP_DIVE', 'TUTORIAL', 'OPINION_PIECE', 'CASE_STUDY', 'THOUGHT_LEADERSHIP', 'STARTUP_ANALYSIS'])
  mode?: BlogMode;

  @ApiPropertyOptional({ enum: ['PROFESSIONAL', 'CASUAL', 'FOUNDER', 'EDUCATOR', 'TECHNICAL_EXPERT'] })
  @IsOptional()
  @IsEnum(['PROFESSIONAL', 'CASUAL', 'FOUNDER', 'EDUCATOR', 'TECHNICAL_EXPERT'])
  tone?: BlogTone;

  @ApiPropertyOptional({ enum: ['DRAFT', 'RESEARCHING', 'GENERATING', 'HUMANIZING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'FAILED'] })
  @IsOptional()
  @IsEnum(['DRAFT', 'RESEARCHING', 'GENERATING', 'HUMANIZING', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'FAILED'])
  status?: BlogStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  focusKeyword?: string;
}
