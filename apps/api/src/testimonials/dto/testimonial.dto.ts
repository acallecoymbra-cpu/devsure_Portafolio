import type { Testimonial, TestimonialInput, TestimonialSource } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, IsUrl, Length, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

/** Kept local, not imported from @devsure/contracts, to avoid the ESM/CJS runtime-import issue under Jest (see SUPPORTED_LOCALES precedent). */
const TESTIMONIAL_SOURCES = ['workana', 'linkedin', 'upwork', 'email', 'other'] as const;

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class CreateTestimonialDto implements TestimonialInput {
  @ApiProperty({ maxLength: 150 })
  @IsString() @Length(1, 150) @Matches(/\S/)
  author!: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @optional() @IsString() @MaxLength(150)
  role?: string;

  @ApiPropertyOptional({ maxLength: 150 })
  @optional() @IsString() @MaxLength(150)
  company?: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString() @Length(1, 2000) @Matches(/\S/)
  quote!: string;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  avatar?: string;

  @ApiPropertyOptional({ enum: TESTIMONIAL_SOURCES })
  @optional() @IsIn(TESTIMONIAL_SOURCES)
  source?: TestimonialSource;

  @ApiPropertyOptional({ maxLength: 500 })
  @optional() @IsUrl({ require_protocol: true }) @MaxLength(500)
  sourceUrl?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;
}

export class UpdateTestimonialDto extends PartialType(CreateTestimonialDto) {}

export class TestimonialDto implements Testimonial {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() author!: string;
  @ApiPropertyOptional() role?: string;
  @ApiPropertyOptional() company?: string;
  @ApiProperty() quote!: string;
  @ApiPropertyOptional() avatar?: string;
  @ApiPropertyOptional({ enum: TESTIMONIAL_SOURCES }) source?: TestimonialSource;
  @ApiPropertyOptional() sourceUrl?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class TestimonialsPageDto {
  @ApiProperty({ type: [TestimonialDto] }) items!: TestimonialDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
