import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary-metrics')
  getSummary() {
    return this.dashboardService.getSummary();
  }
}
