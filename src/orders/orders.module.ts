import { forwardRef, Module } from '@nestjs/common';
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
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OrderCounter.name, schema: OrderCounterSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [
    CustomerOrdersController,
    AdminOrdersController,
    CustomerCartController,
  ],
  providers: [OrdersService, CartService, OrderCounterService, OrdersGateway],
  exports: [
    MongooseModule,
    OrdersService,
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
  ],
})
export class OrdersModule {}
