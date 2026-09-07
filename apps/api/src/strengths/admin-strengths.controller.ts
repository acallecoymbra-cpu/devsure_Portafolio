import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { StrengthsService } from './strengths.service';
import { CreateStrengthDto, StrengthDto, StrengthsPageDto, UpdateStrengthDto } from './dto/strength.dto';
import { ListStrengthsQueryDto } from './dto/list-strengths-query.dto';

@ApiTags('admin strengths') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/strengths') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminStrengthsController {
  constructor(private readonly service: StrengthsService) {}

  @Get() @ApiOkResponse({ type: StrengthsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListStrengthsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: StrengthDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: StrengthDto })
  create(@Req() request: AuthRequest, @Body() input: CreateStrengthDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: StrengthDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateStrengthDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
