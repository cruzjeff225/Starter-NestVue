import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboardService';
import { JwtAuthGuard } from '../../common/guards/jwtAuthGuard';

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('stats')
  getStats() {
    return this.service.getStats();
  }
}
