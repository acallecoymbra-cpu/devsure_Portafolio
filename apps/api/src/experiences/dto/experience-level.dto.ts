import type { ExperienceLevel, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsString,
  Length,
  Matches,
  ValidateIf,
} from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);
const optionalNullable = () =>
  ValidateIf((_object: object, value: unknown) => value !== undefined && value !== null);

export class ExperienceLevelDto implements ExperienceLevel {
  @ApiProperty({ maxLength: 150, example: 'Ssr. Backend Engineer' })
  @IsString() @Length(1, 150) @Matches(/\S/)
  role!: string;

  @ApiPropertyOptional({ format: 'date' })
  @optional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @optionalNullable() @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @optional() @IsBoolean()
  inProgress?: boolean;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(2000)
  description?: TranslatableString;

  @ApiPropertyOptional({ type: 'array', items: { type: 'object', additionalProperties: { type: 'string' } } })
  @optional() @IsArray() @IsTranslatableString(300, { each: true })
  highlights?: TranslatableString[];
}
