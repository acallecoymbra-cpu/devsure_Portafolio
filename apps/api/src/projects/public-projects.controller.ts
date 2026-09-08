import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { SingleOwnerService } from '../common/single-owner.service';
import { ProjectsService } from './projects.service';
import { ListPublicProjectsQueryDto } from './dto/list-public-projects-query.dto';
import { ProjectDto, ProjectsPageDto } from './dto/project.dto';

/** Public `/casos-de-exito` (spec §10.7 follow-up): published projects only, never drafts. */
@ApiTags('projects')
@Controller('projects')
export class PublicProjectsController {
  constructor(
    private readonly service: ProjectsService,
    private readonly singleOwner: SingleOwnerService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List published projects, optionally filtered by category' })
  @ApiOkResponse({ type: ProjectsPageDto })
  async list(@Query() query: ListPublicProjectsQueryDto) {
    const ownerId = await this.singleOwner.resolve();
    return this.service.listPublic(ownerId, query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single published project by slug' })
  @ApiOkResponse({ type: ProjectDto })
  async getBySlug(@Param('slug') slug: string) {
    const ownerId = await this.singleOwner.resolve();
    return this.service.getPublicBySlug(ownerId, slug);
  }
}
