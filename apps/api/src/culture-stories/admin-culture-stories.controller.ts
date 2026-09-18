import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { CultureStoriesService } from './culture-stories.service';
import { CreateCultureStoryDto, CultureStoriesPageDto, CultureStoryDto, UpdateCultureStoryDto } from './dto/culture-story.dto';
import { ListCultureStoriesQueryDto } from './dto/list-culture-stories-query.dto';

@ApiTags('admin culture stories') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/culture-stories') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminCultureStoriesController {
  constructor(private readonly service: CultureStoriesService) {}

  @Get() @ApiOkResponse({ type: CultureStoriesPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListCultureStoriesQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: CultureStoryDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: CultureStoryDto })
  create(@Req() request: AuthRequest, @Body() input: CreateCultureStoryDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: CultureStoryDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateCultureStoryDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
