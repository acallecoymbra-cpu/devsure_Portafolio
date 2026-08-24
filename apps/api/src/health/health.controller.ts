import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { HealthResponse } from '@devsure/contracts';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Check API availability' })
  @ApiOkResponse({
    description: 'The API is available',
    schema: {
      example: {
        status: 'ok',
        service: 'devsure-api',
        timestamp: '2026-08-24T19:25:57.089Z',
      },
    },
  })
  getHealth(): HealthResponse {
    return {
      status: 'ok',
      service: 'devsure-api',
      timestamp: new Date().toISOString(),
    };
  }
}
