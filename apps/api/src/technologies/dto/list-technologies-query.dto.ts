import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function normalizeCategory({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim().toLowerCase() : value;
}

function trimSearch({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function strictBoolean({ value }: TransformFnParams): unknown {
  if (value === true || value === 'true') {
    return true;
  }
  if (value === false || value === 'false') {
    return false;
  }
  return value;
}

export class ListTechnologiesQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 50, type: Number })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 50;

  @ApiPropertyOptional({ type: Boolean, description: 'Strict true/false filter' })
  @IsOptional()
  @Transform(strictBoolean)
  @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({
    maxLength: 64,
    example: 'backend-frameworks',
    description: 'Normalized category slug',
  })
  @IsOptional()
  @Transform(normalizeCategory)
  @IsString()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  category?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 100, example: 'TypeScript' })
  @IsOptional()
  @Transform(trimSearch)
  @IsString()
  @Length(2, 100)
  search?: string;
}
