import { forwardRef, Module } from '@nestjs/common';
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
import { PublicPaymentContrller } from './payments.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TransactionCounter.name, schema: TransactionCounterSchema },
      { name: Payment.name, schema: PaymentSchema },
    ]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [
    CustomerPaymentController,
    AdminPaymentController,
    PublicPaymentContrller,
  ],
  providers: [PaymentsService, TransactionCounterService],
  exports: [MongooseModule, PaymentsService],
})
export class PaymentsModule {}
