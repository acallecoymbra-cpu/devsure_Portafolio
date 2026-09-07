import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectDto, ProjectsPageDto, UpdateProjectDto } from './dto/project.dto';
import { ListProjectsQueryDto } from './dto/list-projects-query.dto';

@ApiTags('admin projects') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/projects') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get() @ApiOkResponse({ type: ProjectsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListProjectsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: ProjectDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: ProjectDto })
  create(@Req() request: AuthRequest, @Body() input: CreateProjectDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: ProjectDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateProjectDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
