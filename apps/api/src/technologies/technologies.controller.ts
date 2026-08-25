import type { PaginatedResponse, TechnologyCard } from '@devsure/contracts';
import { Controller, Get, Query } from '@nestjs/common';
import { ApiBadRequestResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListTechnologiesQueryDto } from './dto/list-technologies-query.dto';
import { TechnologiesPageDto } from './dto/technology-response.dto';
import { TechnologiesService } from './technologies.service';

@ApiTags('technologies')
@Controller('technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  @ApiOperation({ summary: 'List published technologies' })
  @ApiOkResponse({ type: TechnologiesPageDto })
  @ApiBadRequestResponse({
    description: 'One or more query parameters are invalid',
    schema: {
      example: {
        statusCode: 400,
        code: 'HTTP_400',
        message: 'Bad Request',
        requestId: '56ebcd61-f52d-4bd2-9eb2-da437057ce1b',
      },
    },
  })
  list(@Query() query: ListTechnologiesQueryDto): Promise<PaginatedResponse<TechnologyCard>> {
    return this.technologiesService.listPublished(query);
  }
}
