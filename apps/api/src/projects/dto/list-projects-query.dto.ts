import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function trimSearch({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function strictBoolean({ value }: TransformFnParams): unknown {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return value;
}

export class ListProjectsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 50, type: Number })
  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 50;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional() @IsUUID()
  experienceId?: string;

  @ApiPropertyOptional({ type: Boolean })
  @IsOptional() @Transform(strictBoolean) @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ enum: ['draft', 'published'] })
  @IsOptional() @IsIn(['draft', 'published'])
  published?: 'draft' | 'published';

  @ApiPropertyOptional({ minLength: 2, maxLength: 100 })
  @IsOptional() @Transform(trimSearch) @IsString() @Length(2, 100)
  search?: string;
}
