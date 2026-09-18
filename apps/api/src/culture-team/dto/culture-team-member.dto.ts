import type { CultureTeamMember, CultureTeamMemberInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Length, Max, Min, ValidateIf } from 'class-validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateCultureTeamMemberDto implements CultureTeamMemberInput {
  @ApiProperty({ maxLength: 150 })
  @IsString() @Length(1, 150)
  name!: string;

  @ApiProperty({ maxLength: 150 })
  @IsString() @Length(1, 150)
  role!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString() @Length(1, 500)
  neutralImage!: string;

  @ApiProperty({ maxLength: 500 })
  @IsString() @Length(1, 500)
  smilingImage!: string;

  @ApiPropertyOptional({ maxLength: 300 })
  @IsOptional() @IsString() @Length(0, 300)
  alt?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateCultureTeamMemberDto extends PartialType(CreateCultureTeamMemberDto) {}

export class CultureTeamMemberDto implements CultureTeamMember {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() name!: string;
  @ApiProperty() role!: string;
  @ApiProperty() neutralImage!: string;
  @ApiProperty() smilingImage!: string;
  @ApiPropertyOptional() alt?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class CultureTeamPageDto {
  @ApiProperty({ type: [CultureTeamMemberDto] }) items!: CultureTeamMemberDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
