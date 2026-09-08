import type { PublicPortfolio } from '@devsure/contracts';
import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PortfolioService } from './portfolio.service';

@ApiTags('portfolio')
@Controller('portfolio')
export class PortfolioController {
  constructor(private readonly service: PortfolioService) {}

  @Get()
  @ApiOperation({ summary: 'Aggregate every published section the public home page renders, in one request' })
  @ApiOkResponse({ description: 'Profile, Translations and every content module for the site owner' })
  get(): Promise<PublicPortfolio> {
    return this.service.get();
  }
}
