import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { PaymentsService } from './payments.service';
import { CustomerPaymentController } from './customer-payments.controller';
import { AdminPaymentController } from './admin-payments.controller';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Payment.name, schema: PaymentSchema }]),
    OrdersModule,
  ],
  controllers: [CustomerPaymentController, AdminPaymentController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
