import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schema/payment.schema';
import { PaymentsService } from './payments.service';
import { CustomerPaymentController } from './customer-payments.controller';
import { AdminPaymentController } from './admin-payments.controller';
import { OrdersModule } from 'src/orders/orders.module';
import {
  TransactionCounter,
  TransactionCounterSchema,
} from './schema/transaction-counter.schema';
import { TransactionCounterService } from './transaction-counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Payment.name, schema: PaymentSchema },
      { name: TransactionCounter.name, schema: TransactionCounterSchema },
    ]),
    OrdersModule,
  ],
  controllers: [CustomerPaymentController, AdminPaymentController],
  providers: [PaymentsService, TransactionCounterService],
  exports: [MongooseModule],
})
export class PaymentsModule {}
