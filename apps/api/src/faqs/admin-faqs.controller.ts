import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { FaqsService } from './faqs.service';
import { CreateFaqDto, FaqDto, FaqsPageDto, UpdateFaqDto } from './dto/faq.dto';
import { ListFaqsQueryDto } from './dto/list-faqs-query.dto';

@ApiTags('admin faqs') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/faqs') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminFaqsController {
  constructor(private readonly service: FaqsService) {}

  @Get() @ApiOkResponse({ type: FaqsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListFaqsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: FaqDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: FaqDto })
  create(@Req() request: AuthRequest, @Body() input: CreateFaqDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: FaqDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateFaqDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
