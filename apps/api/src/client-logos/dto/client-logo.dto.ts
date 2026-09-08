import type { ClientLogo, ClientLogoInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateClientLogoDto implements ClientLogoInput {
  @ApiProperty({ maxLength: 150 })
  @IsString() @Length(1, 150) @Matches(/\S/)
  name!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString() @Length(1, 255) @Matches(/\S/)
  logo!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @optional() @IsUrl({ require_protocol: true }) @MaxLength(500)
  websiteUrl?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateClientLogoDto extends PartialType(CreateClientLogoDto) {}

export class ClientLogoDto implements ClientLogo {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() logo!: string;
  @ApiPropertyOptional() websiteUrl?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class ClientLogosPageDto {
  @ApiProperty({ type: [ClientLogoDto] }) items!: ClientLogoDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
