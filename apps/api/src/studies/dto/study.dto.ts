import type { Study, StudyInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmptyObject,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);
const optionalNullable = () =>
  ValidateIf((_object: object, value: unknown) => value !== undefined && value !== null);

export class CreateStudyDto implements StudyInput {
  @ApiProperty({ maxLength: 150 })
  @IsString() @Length(1, 150) @Matches(/\S/)
  institution!: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiPropertyOptional({ maxLength: 100 })
  @optional() @IsString() @MaxLength(100)
  field?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(3000)
  description?: TranslatableString;

  @ApiPropertyOptional({ format: 'date' })
  @optional() @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date', nullable: true })
  @optionalNullable() @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional()
  @optional() @IsBoolean()
  inProgress?: boolean;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  logo?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateStudyDto extends PartialType(CreateStudyDto) {}

export class StudyDto implements Study {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() institution!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiPropertyOptional() field?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) description!: TranslatableString;
  @ApiPropertyOptional({ format: 'date' }) startDate?: string;
  @ApiPropertyOptional({ format: 'date', nullable: true }) endDate?: string | null;
  @ApiProperty() inProgress!: boolean;
  @ApiPropertyOptional() logo?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class StudiesPageDto {
  @ApiProperty({ type: [StudyDto] }) items!: StudyDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
