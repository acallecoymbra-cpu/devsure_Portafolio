import type { CulturePillar, CulturePillarInput, CulturePillarVisual } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export const CULTURE_PILLAR_VISUALS: readonly CulturePillarVisual[] = [
  'integrity',
  'honesty',
  'respect',
  'teamwork',
  'humility',
  'commitment',
];

export class CreateCulturePillarDto implements CulturePillarInput {
  @ApiProperty({ maxLength: 100 })
  @IsString() @Length(1, 100)
  title!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @IsOptional() @IsString() @Length(0, 150)
  keywords?: string;

  @ApiProperty({ maxLength: 600 })
  @IsString() @Length(1, 600)
  description!: string;

  @ApiProperty({ enum: CULTURE_PILLAR_VISUALS })
  @IsIn(CULTURE_PILLAR_VISUALS)
  visual!: CulturePillarVisual;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateCulturePillarDto extends PartialType(CreateCulturePillarDto) {}

export class CulturePillarDto implements CulturePillar {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() title!: string;
  @ApiProperty() keywords!: string;
  @ApiProperty() description!: string;
  @ApiProperty({ enum: CULTURE_PILLAR_VISUALS }) visual!: CulturePillarVisual;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class CulturePillarsPageDto {
  @ApiProperty({ type: [CulturePillarDto] }) items!: CulturePillarDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
