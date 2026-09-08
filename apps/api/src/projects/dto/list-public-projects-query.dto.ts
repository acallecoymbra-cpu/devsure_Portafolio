import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function trimSearch({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

/** Public surface of `ListProjectsQueryDto`: no `published`/`experienceId`/`search` — the public list is always published-only. */
export class ListPublicProjectsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 50, type: Number })
  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 50;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional() @Transform(trimSearch) @IsString() @MaxLength(60)
  category?: string;
}
