import type { Strength, StrengthInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsInt, IsNotEmptyObject, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateStrengthDto implements StrengthInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(60)
  label!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(1000)
  body!: TranslatableString;

  @ApiPropertyOptional({ type: [String] })
  @optional() @IsArray() @ArrayMaxSize(30) @IsString({ each: true }) @MaxLength(40, { each: true })
  techStack?: string[];

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateStrengthDto extends PartialType(CreateStrengthDto) {}

export class StrengthDto implements Strength {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) label!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) body!: TranslatableString;
  @ApiProperty({ type: [String] }) techStack!: string[];
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class StrengthsPageDto {
  @ApiProperty({ type: [StrengthDto] }) items!: StrengthDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
