import type { AdminIdentity, AuthResponse } from '@devsure/contracts';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ minLength: 3, maxLength: 32 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' ? value.trim() : value)
  @IsString() @Length(3, 32) @Matches(/^[a-zA-Z0-9._-]+$/) username!: string;
  @ApiProperty({ format: 'password', minLength: 1, maxLength: 128 })
  @IsString() @Length(1, 128) password!: string;
}
export class ChangePasswordDto {
  @ApiProperty({ format: 'password' })
  @IsString() @Length(1, 128) currentPassword!: string;
  @ApiProperty({ format: 'password', minLength: 12, maxLength: 128 })
  @IsString() @Length(12, 128) newPassword!: string;
}
export class AdminIdentityDto implements AdminIdentity {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty() username!: string;
  @ApiProperty({ format: 'email' }) email!: string;
  @ApiProperty({ enum: ['ADMIN'] }) role!: 'ADMIN';
  @ApiProperty() mustChangePassword!: boolean;
}
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: AdminIdentityDto }) user!: AdminIdentityDto;
  @ApiProperty() csrfToken!: string;
}
