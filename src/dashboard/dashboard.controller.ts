import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { DashboardService } from './dashboard.service';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import { PaymentMethod } from 'src/payments/schema/payment.schema';

// @UseGuards(AuthGuard('jwt'), RoleGuard)
// @Roles('manager', 'admin')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly analyticsDashboardService: AnalyticsDashboardService,
  ) {}

  @Get('summary-metrics')
  getSummary() {
    return this.dashboardService.getSummary();
  }

  @Get('recent-orders')
  getRecentOrders() {
    return this.dashboardService.getRecentOrders();
  }

  @Get('analytics')
  async getRevenues(
    @Query('month') month: string,
    @Query('week') week: string,
    @Query('method') method: PaymentMethod,
  ) {
    return await this.analyticsDashboardService.getRevenueData({
      month,
      week,
      method,
    });
  }
}
