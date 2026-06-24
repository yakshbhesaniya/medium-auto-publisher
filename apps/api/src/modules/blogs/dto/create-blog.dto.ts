import { IsString, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BlogMode, BlogTone } from '@medium-publisher/types';

export class CreateBlogDto {
  @ApiPropertyOptional({ example: 'The Future of AI in Development' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: 'Link to an existing topic' })
  @IsOptional()
  @IsString()
  topicId?: string;

  @ApiPropertyOptional({
    enum: ['TECHNICAL_DEEP_DIVE', 'TUTORIAL', 'OPINION_PIECE', 'CASE_STUDY', 'THOUGHT_LEADERSHIP', 'STARTUP_ANALYSIS'],
    default: 'TECHNICAL_DEEP_DIVE',
  })
  @IsOptional()
  @IsEnum(['TECHNICAL_DEEP_DIVE', 'TUTORIAL', 'OPINION_PIECE', 'CASE_STUDY', 'THOUGHT_LEADERSHIP', 'STARTUP_ANALYSIS'])
  mode?: BlogMode;

  @ApiPropertyOptional({
    enum: ['PROFESSIONAL', 'CASUAL', 'FOUNDER', 'EDUCATOR', 'TECHNICAL_EXPERT'],
    default: 'PROFESSIONAL',
  })
  @IsOptional()
  @IsEnum(['PROFESSIONAL', 'CASUAL', 'FOUNDER', 'EDUCATOR', 'TECHNICAL_EXPERT'])
  tone?: BlogTone;

  @ApiPropertyOptional({ example: ['AI', 'technology', 'software'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'artificial intelligence' })
  @IsOptional()
  @IsString()
  focusKeyword?: string;
}
