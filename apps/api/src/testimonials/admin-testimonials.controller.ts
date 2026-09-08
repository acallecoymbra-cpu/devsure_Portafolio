import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiHeader, ApiNoContentResponse, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AdminGuard, AuthRequest, OriginGuard, SessionGuard } from '../auth/auth.guards';
import { TestimonialsService } from './testimonials.service';
import { CreateTestimonialDto, TestimonialDto, TestimonialsPageDto, UpdateTestimonialDto } from './dto/testimonial.dto';
import { ListTestimonialsQueryDto } from './dto/list-testimonials-query.dto';

@ApiTags('admin testimonials') @ApiCookieAuth()
@ApiHeader({ name: 'x-csrf-token', description: 'Required for mutations', required: false })
@Controller('admin/testimonials') @UseGuards(OriginGuard, SessionGuard, AdminGuard)
export class AdminTestimonialsController {
  constructor(private readonly service: TestimonialsService) {}

  @Get() @ApiOkResponse({ type: TestimonialsPageDto })
  list(@Req() request: AuthRequest, @Query() query: ListTestimonialsQueryDto) {
    return this.service.list(request.auth.user.id, query);
  }

  @Get(':id') @ApiOkResponse({ type: TestimonialDto })
  get(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.get(request.auth.user.id, id);
  }

  @Post() @ApiCreatedResponse({ type: TestimonialDto })
  create(@Req() request: AuthRequest, @Body() input: CreateTestimonialDto) {
    return this.service.create(request.auth.user.id, input);
  }

  @Patch(':id') @ApiOkResponse({ type: TestimonialDto })
  update(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string, @Body() input: UpdateTestimonialDto) {
    return this.service.update(request.auth.user.id, id, input);
  }

  @Delete(':id') @HttpCode(204) @ApiNoContentResponse()
  remove(@Req() request: AuthRequest, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.remove(request.auth.user.id, id);
  }
}
