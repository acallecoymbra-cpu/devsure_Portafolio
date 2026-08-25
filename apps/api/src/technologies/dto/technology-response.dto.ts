import type { PaginatedResponse, PaginationMeta, TechnologyCard } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TechnologyCardDto implements TechnologyCard {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ example: 'TypeScript' })
  name!: string;

  @ApiProperty({ example: 'typescript' })
  slug!: string;

  @ApiProperty({ example: 'lenguajes-programacion' })
  category!: string;

  @ApiPropertyOptional({ example: 'Optional editorial summary' })
  summary?: string;

  @ApiProperty({ example: 'code' })
  iconKey!: string;

  @ApiProperty({ example: false })
  featured!: boolean;

  @ApiProperty({ minimum: 0, example: 1 })
  sortOrder!: number;
}

export class PaginationMetaDto implements PaginationMeta {
  @ApiProperty({ minimum: 1 })
  page!: number;

  @ApiProperty({ minimum: 1, maximum: 50 })
  limit!: number;

  @ApiProperty({ minimum: 0 })
  total!: number;

  @ApiProperty({ minimum: 0 })
  totalPages!: number;
}

export class TechnologiesPageDto implements PaginatedResponse<TechnologyCard> {
  @ApiProperty({ type: () => [TechnologyCardDto] })
  items!: TechnologyCardDto[];

  @ApiProperty({ type: () => PaginationMetaDto })
  meta!: PaginationMetaDto;
}
