import type { TranslatableString, WorkStyleItem, WorkStyleItemInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmptyObject, Max, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateWorkStyleItemDto implements WorkStyleItemInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(300)
  text!: TranslatableString;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateWorkStyleItemDto extends PartialType(CreateWorkStyleItemDto) {}

export class WorkStyleItemDto implements WorkStyleItem {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) text!: TranslatableString;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class WorkStyleItemsPageDto {
  @ApiProperty({ type: [WorkStyleItemDto] }) items!: WorkStyleItemDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
