import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { ClientLogosService } from './client-logos.service';
import { ClientLogoDto, ClientLogosPageDto, CreateClientLogoDto, UpdateClientLogoDto } from './dto/client-logo.dto';
import { ListClientLogosQueryDto } from './dto/list-client-logos-query.dto';

@ApiTags('admin client logos') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/client-logos') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminClientLogosController {
  constructor(private readonly service: ClientLogosService) {}

  @Get() @ApiOkResponse({ type: ClientLogosPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListClientLogosQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: ClientLogoDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: ClientLogoDto })
  create(@Req() request: AuthRequest, @Body() input: CreateClientLogoDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: ClientLogoDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateClientLogoDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
