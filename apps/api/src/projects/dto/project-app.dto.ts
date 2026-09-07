import type { ProjectApp, TranslatableString } from '@devsure/contracts';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString, Length, MaxLength, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { IsStringRecord } from '../../common/validators/string-record.validator';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class ProjectAppDto implements ProjectApp {
  @ApiProperty({ maxLength: 150, example: 'Web App' })
  @IsString() @Length(1, 150)
  name!: string;

  @ApiPropertyOptional({ maxLength: 60, example: 'Web' })
  @optional() @IsString() @MaxLength(60)
  platform?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(1000)
  description?: TranslatableString;

  @ApiPropertyOptional({ type: [String] })
  @optional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(40, { each: true })
  techStack?: string[];

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' }, example: { Live: 'https://...' } })
  @optional() @IsStringRecord({ maxEntries: 10, maxKeyLength: 30, maxValueLength: 500 })
  links?: Record<string, string>;
}
