import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { CulturePillarsService } from './culture-pillars.service';
import { CreateCulturePillarDto, CulturePillarDto, CulturePillarsPageDto, UpdateCulturePillarDto } from './dto/culture-pillar.dto';
import { ListCulturePillarsQueryDto } from './dto/list-culture-pillars-query.dto';

@ApiTags('admin culture pillars') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/culture-pillars') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminCulturePillarsController {
  constructor(private readonly service: CulturePillarsService) {}

  @Get() @ApiOkResponse({ type: CulturePillarsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListCulturePillarsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: CulturePillarDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: CulturePillarDto })
  create(@Req() request: AuthRequest, @Body() input: CreateCulturePillarDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: CulturePillarDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateCulturePillarDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
