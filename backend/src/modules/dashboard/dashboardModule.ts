import { Module } from '@nestjs/common';
import { DashboardController } from './dashboardController';
import { DashboardService } from './dashboardService';
import { PrismaModule } from '../../prisma/prismaModule';

@Module({
  imports: [PrismaModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
