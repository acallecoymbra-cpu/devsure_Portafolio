import type { SocialLink, SocialLinkInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsString, IsUrl, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateSocialLinkDto implements SocialLinkInput {
  @ApiProperty({ maxLength: 100, example: 'LinkedIn' })
  @IsString() @Length(1, 100) @Matches(/\S/)
  name!: string;

  @ApiProperty({ maxLength: 500 })
  @IsUrl({ require_protocol: true }) @MaxLength(500)
  url!: string;

  @ApiProperty({ maxLength: 32, example: 'linkedin' })
  @IsString() @Length(1, 32) @Matches(/\S/)
  iconKey!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  icon?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateSocialLinkDto extends PartialType(CreateSocialLinkDto) {}

export class SocialLinkDto implements SocialLink {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() url!: string;
  @ApiProperty() iconKey!: string;
  @ApiPropertyOptional() icon?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class SocialLinksPageDto {
  @ApiProperty({ type: [SocialLinkDto] }) items!: SocialLinkDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
