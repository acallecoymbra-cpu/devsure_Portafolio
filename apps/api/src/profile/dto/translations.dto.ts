import type { Translations, TranslatableString, UpdateTranslationsInput } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, MaxLength, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';

const HEADING_MAX = 150;
const INTRO_MAX = 500;

function heading() {
  return IsTranslatableString(HEADING_MAX);
}

function intro() {
  return IsTranslatableString(INTRO_MAX);
}

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class UpdateTranslationsDto implements UpdateTranslationsInput {
  @ApiPropertyOptional({ maxLength: 60 })
  @optional() @IsString() @MaxLength(60)
  heroTag?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() heroTitle?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() heroCopy?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() heroNote?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() aboutHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @IsTranslatableString(3000) aboutBody?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() strengthsHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() strengthsIntro?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() experienceHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() experienceIntro?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() educationHeading?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() portfolioHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() portfolioIntro?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() skillsHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() skillsIntro?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() workstyleHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() workstyleIntro?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() testimonialsHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() faqHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() blogHeading?: TranslatableString;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @heading() contactHeading?: TranslatableString;
  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } }) @optional() @intro() contactIntro?: TranslatableString;
}

export class TranslationsDto implements Translations {
  @ApiPropertyOptional() heroTag?: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) heroTitle!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) heroCopy!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) heroNote!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) aboutHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) aboutBody!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) strengthsHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) strengthsIntro!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) experienceHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) experienceIntro!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) educationHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) portfolioHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) portfolioIntro!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) skillsHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) skillsIntro!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) workstyleHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) workstyleIntro!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) testimonialsHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) faqHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) blogHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) contactHeading!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) contactIntro!: TranslatableString;
}
