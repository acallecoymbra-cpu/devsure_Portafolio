import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { ProfileDto, UpdateProfileDto } from './dto/profile.dto';
import { ProfileService } from './profile.service';

@ApiTags('admin profile') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/profile') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminProfileController {
  constructor(private readonly service: ProfileService) {}
  @Get() @ApiOkResponse({ type: ProfileDto })
  get(@Req() request: AuthRequest) { return this.service.get(request.auth.user.id); }
  @Patch() @ApiOkResponse({ type: ProfileDto })
  update(@Req() request: AuthRequest, @Body() input: UpdateProfileDto) {
    return this.service.update(request.auth.user.id, input);
  }
}
