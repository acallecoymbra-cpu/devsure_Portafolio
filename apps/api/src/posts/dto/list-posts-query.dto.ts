import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

const POST_CATEGORIES = ['engineering', 'qa', 'case-studies', 'company-news'] as const;

function trimSearch({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListPostsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 50, type: Number })
  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 50;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional() @IsIn(['draft', 'published'])
  published?: 'draft' | 'published';

  @ApiPropertyOptional({ enum: POST_CATEGORIES })
  @IsOptional() @IsIn(POST_CATEGORIES)
  category?: string;

  @ApiPropertyOptional({ minLength: 2, maxLength: 150 })
  @IsOptional() @Transform(trimSearch) @IsString() @Length(2, 150)
  search?: string;
}
