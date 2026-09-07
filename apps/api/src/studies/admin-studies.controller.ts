import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { StudiesService } from './studies.service';
import { CreateStudyDto, StudiesPageDto, StudyDto, UpdateStudyDto } from './dto/study.dto';
import { ListStudiesQueryDto } from './dto/list-studies-query.dto';

@ApiTags('admin studies') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/studies') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminStudiesController {
  constructor(private readonly service: StudiesService) {}

  @Get() @ApiOkResponse({ type: StudiesPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListStudiesQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: StudyDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: StudyDto })
  create(@Req() request: AuthRequest, @Body() input: CreateStudyDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: StudyDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateStudyDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
