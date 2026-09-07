import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { AdminTechnologiesService } from './admin-technologies.service';
import { AdminTechnologiesPageDto, AdminTechnologyDto, CreateTechnologyDto, UpdateTechnologyDto } from './dto/admin-technology.dto';
import { ListTechnologiesQueryDto } from './dto/list-technologies-query.dto';

@ApiTags('admin technologies') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/technologies') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminTechnologiesController {
  constructor(private readonly service: AdminTechnologiesService) {}
  @Get() @ApiOkResponse({ type: AdminTechnologiesPageDto })
  list(@Query() query: ListTechnologiesQueryDto) { return this.service.list(query); }
  @Get(':id') @ApiOkResponse({ type: AdminTechnologyDto })
  get(@Param('id', ParseUUIDPipe) id: string) { return this.service.get(id); }
  @Post() @ApiCreatedResponse({ type: AdminTechnologyDto })
  create(@Body() input: CreateTechnologyDto) { return this.service.create(input); }
  @Patch(':id') @ApiOkResponse({ type: AdminTechnologyDto })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateTechnologyDto) { return this.service.update(id, input); }
  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Param('id', ParseUUIDPipe) id: string) { return this.service.remove(id); }
}
