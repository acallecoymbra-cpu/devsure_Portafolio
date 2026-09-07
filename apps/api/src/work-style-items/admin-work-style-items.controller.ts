import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { WorkStyleItemsService } from './work-style-items.service';
import { CreateWorkStyleItemDto, UpdateWorkStyleItemDto, WorkStyleItemDto, WorkStyleItemsPageDto } from './dto/work-style-item.dto';
import { ListWorkStyleItemsQueryDto } from './dto/list-work-style-items-query.dto';

@ApiTags('admin work style items') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/work-style-items') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminWorkStyleItemsController {
  constructor(private readonly service: WorkStyleItemsService) {}

  @Get() @ApiOkResponse({ type: WorkStyleItemsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListWorkStyleItemsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: WorkStyleItemDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: WorkStyleItemDto })
  create(@Req() request: AuthRequest, @Body() input: CreateWorkStyleItemDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: WorkStyleItemDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateWorkStyleItemDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
