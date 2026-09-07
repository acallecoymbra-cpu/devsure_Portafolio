import type { Profile, TranslatableString, UpdateProfileInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEmail,
  IsIn,
  IsString,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { SUPPORTED_LOCALES } from '../../common/locales';

export class UpdateProfileDto implements UpdateProfileInput {
  @ApiPropertyOptional({ format: 'email', maxLength: 254 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail() @MaxLength(254)
  email?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString() @Length(1, 150) @Matches(/\S/)
  name?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MaxLength(150)
  fullName?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @ValidateIf((_object, value) => value !== undefined)
  @IsTranslatableString(300)
  headline?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @ValidateIf((_object, value) => value !== undefined)
  @IsTranslatableString(5000)
  bio?: TranslatableString;

  @ApiPropertyOptional({ maxLength: 255 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MaxLength(255)
  avatar?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @ValidateIf((_object, value) => value !== undefined)
  @IsTranslatableString(255)
  resume?: TranslatableString;

  @ApiPropertyOptional({ type: [String], enum: SUPPORTED_LOCALES })
  @ValidateIf((_object, value) => value !== undefined)
  @IsArray() @ArrayMinSize(1) @ArrayUnique() @IsIn(SUPPORTED_LOCALES, { each: true })
  activeLocales?: string[];

  @ApiPropertyOptional({ enum: SUPPORTED_LOCALES })
  @ValidateIf((_object, value) => value !== undefined)
  @IsIn(SUPPORTED_LOCALES)
  defaultLocale?: string;
}

export class ProfileDto implements Profile {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() username!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty() name!: string;
  @ApiPropertyOptional() fullName?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) headline!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) bio!: TranslatableString;
  @ApiPropertyOptional() avatar?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) resume!: TranslatableString;
  @ApiProperty({ type: [String] }) activeLocales!: string[];
  @ApiProperty() defaultLocale!: string;
}
