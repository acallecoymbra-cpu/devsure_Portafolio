import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { SocialLinksService } from './social-links.service';
import { CreateSocialLinkDto, SocialLinkDto, SocialLinksPageDto, UpdateSocialLinkDto } from './dto/social-link.dto';
import { ListSocialLinksQueryDto } from './dto/list-social-links-query.dto';

@ApiTags('admin social links') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/social-links') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminSocialLinksController {
  constructor(private readonly service: SocialLinksService) {}

  @Get() @ApiOkResponse({ type: SocialLinksPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListSocialLinksQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: SocialLinkDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: SocialLinkDto })
  create(@Req() request: AuthRequest, @Body() input: CreateSocialLinkDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: SocialLinkDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateSocialLinkDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
