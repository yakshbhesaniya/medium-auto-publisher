import { IsString, IsOptional, IsBoolean, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlaylistDto {
  @ApiProperty({ example: 'My AI Learning Series' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'A curated playlist of blogs about AI development' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Technology' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'https://example.com/cover.png' })
  @IsOptional()
  @IsString()
  coverImage?: string;
}

export class UpdatePlaylistDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  coverImage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class AddBlogToPlaylistDto {
  @ApiProperty({ description: 'Blog ID to add to the playlist' })
  @IsString()
  blogId: string;

  @ApiPropertyOptional({ description: 'Order position in the playlist', default: 0 })
  @IsOptional()
  order?: number;
}

export class ReorderBlogsDto {
  @ApiProperty({ description: 'Ordered array of blog IDs', type: [String] })
  @IsArray()
  @IsString({ each: true })
  orderedBlogIds: string[];
}
