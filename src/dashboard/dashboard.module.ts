import { Module } from '@nestjs/common';
import { MenuModule } from 'src/menu/menu.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { UserModule } from 'src/users/user.module';
import { AnalyticsDashboardService } from './analytics-dashboard.service';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [OrdersModule, PaymentsModule, MenuModule, UserModule],
  providers: [AnalyticsDashboardService, DashboardService],
  exports: [AnalyticsDashboardService],
})
export class DashboardModule {}
