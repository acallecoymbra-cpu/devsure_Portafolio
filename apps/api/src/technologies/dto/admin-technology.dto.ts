import type { AdminTechnology, TechnologyInput, TechnologyPublicationStatus } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsInt, IsString, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { TechnologyCardDto, PaginationMetaDto } from './technology-response.dto';

export class CreateTechnologyDto implements TechnologyInput {
  @ApiProperty({ maxLength: 100 }) @IsString() @Length(1, 100) @Matches(/\S/) name!: string;
  @ApiProperty({ maxLength: 64 }) @IsString() @MaxLength(64) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) slug!: string;
  @ApiProperty({ maxLength: 64 }) @IsString() @MaxLength(64) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) category!: string;
  @ApiPropertyOptional({ maxLength: 300 }) @ValidateIf((_object, value) => value !== undefined) @IsString() @MaxLength(300) summary?: string;
  @ApiProperty({ maxLength: 64 }) @IsString() @MaxLength(64) @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/) iconKey!: string;
  @ApiProperty() @IsBoolean() featured!: boolean;
  @ApiProperty({ minimum: 0, maximum: 2147483647 }) @IsInt() @Min(0) @Max(2147483647) sortOrder!: number;
  @ApiProperty({ enum: ['draft', 'published'] }) @IsIn(['draft', 'published']) publicationStatus!: TechnologyPublicationStatus;
}
export class UpdateTechnologyDto extends PartialType(CreateTechnologyDto, { skipNullProperties: false }) {}
export class AdminTechnologyDto extends TechnologyCardDto implements AdminTechnology {
  @ApiProperty({ enum: ['draft', 'published'] }) publicationStatus!: TechnologyPublicationStatus;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}
export class AdminTechnologiesPageDto {
  @ApiProperty({ type: [AdminTechnologyDto] }) items!: AdminTechnologyDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
