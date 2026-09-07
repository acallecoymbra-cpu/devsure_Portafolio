import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { ExperiencesService } from './experiences.service';
import { CreateExperienceDto, ExperienceDto, ExperiencesPageDto, UpdateExperienceDto } from './dto/experience.dto';
import { ListExperiencesQueryDto } from './dto/list-experiences-query.dto';

@ApiTags('admin experiences') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/experiences') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminExperiencesController {
  constructor(private readonly service: ExperiencesService) {}

  @Get() @ApiOkResponse({ type: ExperiencesPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListExperiencesQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: ExperienceDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: ExperienceDto })
  create(@Req() request: AuthRequest, @Body() input: CreateExperienceDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: ExperienceDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateExperienceDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
