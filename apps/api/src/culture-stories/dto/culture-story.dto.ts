import type { CultureStory, CultureStoryInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmptyObject, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateCultureStoryDto implements CultureStoryInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(60)
  kicker!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(600)
  description!: TranslatableString;

  @ApiProperty({ maxLength: 500 })
  @IsString() @Length(1, 500)
  imageSrc!: string;

  @ApiProperty({ maxLength: 300 })
  @IsString() @Length(1, 300)
  imageAlt!: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateCultureStoryDto extends PartialType(CreateCultureStoryDto) {}

export class CultureStoryDto implements CultureStory {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) kicker!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) description!: TranslatableString;
  @ApiProperty() imageSrc!: string;
  @ApiProperty() imageAlt!: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class CultureStoriesPageDto {
  @ApiProperty({ type: [CultureStoryDto] }) items!: CultureStoryDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
