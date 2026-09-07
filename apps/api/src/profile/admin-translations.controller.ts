import { Body, Controller, Get, Patch, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiHeader, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { TranslationsDto, UpdateTranslationsDto } from './dto/translations.dto';
import { TranslationsService } from './translations.service';

@ApiTags('admin translations') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/translations') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminTranslationsController {
  constructor(private readonly service: TranslationsService) {}
  @Get() @ApiOkResponse({ type: TranslationsDto })
  get(@Req() request: AuthRequest) { return this.service.get(request.auth.user.id); }
  @Patch() @ApiOkResponse({ type: TranslationsDto })
  update(@Req() request: AuthRequest, @Body() input: UpdateTranslationsDto) {
    return this.service.update(request.auth.user.id, input);
  }
}
