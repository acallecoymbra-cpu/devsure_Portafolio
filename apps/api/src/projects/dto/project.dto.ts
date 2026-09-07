import type { Project, ProjectInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsISO8601,
  IsInt,
  IsNotEmptyObject,
  IsString,
  IsUrl,
  IsUUID,
  Max,
  MaxLength,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { ProjectAppDto } from './project-app.dto';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);
const optionalNullable = () =>
  ValidateIf((_object: object, value: unknown) => value !== undefined && value !== null);

export class CreateProjectDto implements ProjectInput {
  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  @optionalNullable() @IsUUID()
  experienceId?: string | null;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiPropertyOptional({ maxLength: 160 })
  @optional() @IsString() @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(300)
  excerpt?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(5000)
  description?: TranslatableString;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  coverImage?: string;

  @ApiPropertyOptional({ type: [String] })
  @optional() @IsArray() @ArrayMaxSize(20) @IsString({ each: true }) @MaxLength(255, { each: true })
  gallery?: string[];

  @ApiPropertyOptional({ type: [String] })
  @optional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(40, { each: true })
  techStack?: string[];

  @ApiPropertyOptional({ type: [ProjectAppDto] })
  @optional() @IsArray() @ArrayMaxSize(10) @ValidateNested({ each: true }) @Type(() => ProjectAppDto)
  apps?: ProjectAppDto[];

  @ApiPropertyOptional({ maxLength: 500 })
  @optional() @IsUrl({ require_protocol: true })
  url?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @optional() @IsUrl({ require_protocol: true })
  repoUrl?: string;

  @ApiPropertyOptional()
  @optional() @IsBoolean()
  featured?: boolean;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;

  @ApiPropertyOptional({ format: 'date-time', nullable: true, description: 'null = draft' })
  @optionalNullable() @IsISO8601()
  publishedAt?: string | null;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

export class ProjectDto implements Project {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiPropertyOptional({ format: 'uuid' }) experienceId?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) excerpt!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) description!: TranslatableString;
  @ApiPropertyOptional() coverImage?: string;
  @ApiProperty({ type: [String] }) gallery!: string[];
  @ApiProperty({ type: [String] }) techStack!: string[];
  @ApiProperty({ type: [ProjectAppDto] }) apps!: ProjectAppDto[];
  @ApiPropertyOptional() url?: string;
  @ApiPropertyOptional() repoUrl?: string;
  @ApiProperty() featured!: boolean;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ProjectsPageDto {
  @ApiProperty({ type: [ProjectDto] }) items!: ProjectDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
