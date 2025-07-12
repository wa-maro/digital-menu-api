import { Module } from '@nestjs/common';
import { MenuModule } from 'src/menu/menu.module';
import { OrdersModule } from 'src/orders/orders.module';
import { PaymentsModule } from 'src/payments/payments.module';
import { UserModule } from 'src/users/user.module';

@Module({
  imports: [OrdersModule, PaymentsModule, MenuModule, UserModule],
})
export class DashboardModule {}
