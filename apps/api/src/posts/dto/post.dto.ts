import type { Post, PostCategory, PostInput, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsISO8601, IsInt, IsNotEmptyObject, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';
import { PaginationMetaDto } from '../../technologies/dto/technology-response.dto';

/** Kept local, not imported from @devsure/contracts, to avoid the ESM/CJS runtime-import issue under Jest (see SUPPORTED_LOCALES precedent). */
const POST_CATEGORIES = ['engineering', 'qa', 'case-studies', 'company-news'] as const;

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);
const optionalNullable = () =>
  ValidateIf((_object: object, value: unknown) => value !== undefined && value !== null);

export class CreatePostDto implements PostInput {
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(150)
  title!: TranslatableString;

  @ApiPropertyOptional({ maxLength: 160 })
  @optional() @IsString() @MaxLength(160)
  slug?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: { type: 'string' } })
  @optional() @IsTranslatableString(300)
  excerpt?: TranslatableString;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsNotEmptyObject() @IsTranslatableString(20000)
  content!: TranslatableString;

  @ApiPropertyOptional({ enum: POST_CATEGORIES })
  @optional() @IsIn(POST_CATEGORIES)
  category?: PostCategory;

  @ApiPropertyOptional({ maxLength: 255 })
  @optional() @IsString() @MaxLength(255)
  coverImage?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 2147483647 })
  @optional() @IsInt() @Min(0) @Max(2147483647)
  sortOrder?: number;

  @ApiPropertyOptional({ format: 'date-time', nullable: true, description: 'null = draft' })
  @optionalNullable() @IsISO8601()
  publishedAt?: string | null;
}

export class UpdatePostDto extends PartialType(CreatePostDto) {}

export class PostDto implements Post {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) title!: TranslatableString;
  @ApiProperty() slug!: string;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) excerpt!: TranslatableString;
  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } }) content!: TranslatableString;
  @ApiPropertyOptional({ enum: POST_CATEGORIES }) category?: PostCategory;
  @ApiPropertyOptional() coverImage?: string;
  @ApiProperty() sortOrder!: number;
  @ApiProperty({ type: String, nullable: true, format: 'date-time' }) publishedAt!: string | null;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
  @ApiProperty({ format: 'date-time' }) updatedAt!: string;
}

export class PostsPageDto {
  @ApiProperty({ type: [PostDto] }) items!: PostDto[];
  @ApiProperty({ type: PaginationMetaDto }) meta!: PaginationMetaDto;
}
