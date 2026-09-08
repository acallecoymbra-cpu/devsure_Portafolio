import type { ProfileStat, TranslatableString } from '@devsure/contracts';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { IsTranslatableString } from '../../common/validators/translatable-string.validator';

const optional = () => ValidateIf((_object: object, value: unknown) => value !== undefined);

export class ProfileStatDto implements ProfileStat {
  @ApiProperty({ minimum: 0, maximum: 1000000 })
  @IsInt() @Min(0) @Max(1000000)
  value!: number;

  @ApiPropertyOptional({ maxLength: 8, example: '+' })
  @optional() @IsString() @MaxLength(8)
  suffix?: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'string' } })
  @IsTranslatableString(120)
  label!: TranslatableString;
}
