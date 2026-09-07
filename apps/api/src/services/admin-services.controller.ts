import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { ServicesService } from './services.service';
import { CreateServiceDto, ServiceDto, ServicesPageDto, UpdateServiceDto } from './dto/service.dto';
import { ListServicesQueryDto } from './dto/list-services-query.dto';

@ApiTags('admin services') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/services') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminServicesController {
  constructor(private readonly service: ServicesService) {}

  @Get() @ApiOkResponse({ type: ServicesPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListServicesQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: ServiceDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: ServiceDto })
  create(@Req() request: AuthRequest, @Body() input: CreateServiceDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: ServiceDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateServiceDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
