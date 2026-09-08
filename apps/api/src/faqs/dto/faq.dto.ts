import type { Faq, FaqInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmptyObject, Max, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateFaqDto implements FaqInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(200)
  question!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(2000)
  answer!: TranslatableString;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateFaqDto extends PartialType(CreateFaqDto) {}

export class FaqDto implements Faq {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) question!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) answer!: TranslatableString;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class FaqsPageDto {
  @ApiProperty({ type: [FaqDto] }) items!: FaqDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
