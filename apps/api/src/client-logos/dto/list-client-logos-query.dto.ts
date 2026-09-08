import { Transform, TransformFnParams, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

function trimSearch({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class ListClientLogosQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1, type: Number })
  @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 50, minimum: 1, maximum: 50, type: Number })
  @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 50;

  @ApiPropertyOptional({ minLength: 2, maxLength: 150, example: 'Acme' })
  @IsOptional() @Transform(trimSearch) @IsString() @Length(2, 150)
  search?: string;
}
