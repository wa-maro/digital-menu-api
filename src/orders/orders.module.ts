import { Module } from '@nestjs/common';
import { CustomerOrdersController } from './customer-orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Cart, CartSchema } from 'src/cart/schemas/cart.schema';
import { CustomerCartController } from 'src/cart/customer-cart.controller';
import { CartService } from 'src/cart/cart.service';
import { OrdersGateway } from './orders.gateway';
import { AdminOrdersController } from './admin-orders.controller';
import {
  OrderCounter,
  OrderCounterSchema,
} from './schemas/order-counter.schema';
import { OrderCounterService } from './order-counter.service';
import {
  TransactionCounter,
  TransactionCounterSchema,
} from './schemas/transaction-counter.schema';
import { TransactionCounterService } from './transaction-counter.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
      { name: OrderCounter.name, schema: OrderCounterSchema },
      { name: TransactionCounter.name, schema: TransactionCounterSchema },
    ]),
  ],
  controllers: [
    CustomerOrdersController,
    AdminOrdersController,
    CustomerCartController,
  ],
  providers: [
    OrdersService,
    CartService,
    OrderCounterService,
    TransactionCounterService,
    OrdersGateway,
  ],
  exports: [MongooseModule, OrdersService],
})
export class OrdersModule {}
