import type { Experience, ExperienceInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Length,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { ExperienceLevelDto } from './experience-level.dto';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateExperienceDto implements ExperienceInput {
  @ApiProperty({ maxLength: 150 }) @IsString() @Length(1, 150) @Matches(/\S/)
  company!: string;

  @ApiPropertyOptional({ maxLength: 160 })
  @optional() @IsString() @MaxLength(160) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  logo?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(2000)
  summary?: TranslatableString;

  @ApiPropertyOptional({ type: [String] })
  @optional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(40, { each: true })
  techStack?: string[];

  @ApiProperty({ type: [ExperienceLevelDto] })
  @IsArray() @ArrayMinSize(1) @ValidateNested({ each: true }) @Type(() => ExperienceLevelDto)
  levels!: ExperienceLevelDto[];

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateExperienceDto extends PartialType(CreateExperienceDto) {}

export class ExperienceDto implements Experience {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() company!: string;
  @ApiProperty() slug!: string;
  @ApiPropertyOptional() logo?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) summary!: TranslatableString;
  @ApiProperty({ type: [String] }) techStack!: string[];
  @ApiProperty({ type: [ExperienceLevelDto] }) levels!: ExperienceLevelDto[];
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ExperiencesPageDto {
  @ApiProperty({ type: [ExperienceDto] }) items!: ExperienceDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
