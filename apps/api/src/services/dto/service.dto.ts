import type { Service, ServiceInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsNotEmptyObject, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateServiceDto implements ServiceInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(2000)
  description!: TranslatableString;

  @ApiPropertyOptional({ maxLength: 60, example: 'ti-server' })
  @optional() @IsString() @MaxLength(60) @Matches(/^[a-z][a-z0-9-]*$/)
  icon?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateServiceDto extends PartialType(CreateServiceDto) {}

export class ServiceDto implements Service {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) description!: TranslatableString;
  @ApiPropertyOptional() icon?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ServicesPageDto {
  @ApiProperty({ type: [ServiceDto] }) items!: ServiceDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
