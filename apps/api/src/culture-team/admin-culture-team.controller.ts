import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { CultureTeamService } from './culture-team.service';
import { CreateCultureTeamMemberDto, CultureTeamMemberDto, CultureTeamPageDto, UpdateCultureTeamMemberDto } from './dto/culture-team-member.dto';
import { ListCultureTeamQueryDto } from './dto/list-culture-team-query.dto';

@ApiTags('admin culture team') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/culture-team') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminCultureTeamController {
  constructor(private readonly service: CultureTeamService) {}

  @Get() @ApiOkResponse({ type: CultureTeamPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListCultureTeamQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: CultureTeamMemberDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: CultureTeamMemberDto })
  create(@Req() request: AuthRequest, @Body() input: CreateCultureTeamMemberDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: CultureTeamMemberDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateCultureTeamMemberDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
