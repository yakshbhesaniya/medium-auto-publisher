import { IsString, IsOptional, IsEmail, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'John Doe' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;
}

export class UpdateMediumTokenDto {
  @ApiPropertyOptional({ description: 'Medium Integration Token from Settings > Security' })
  @IsString()
  mediumToken: string;
}
