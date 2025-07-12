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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
  ],
  controllers: [
    CustomerOrdersController,
    AdminOrdersController,
    CustomerCartController,
  ],
  providers: [OrdersService, CartService, OrdersGateway],
  exports: [OrdersService, MongooseModule],
})
export class OrdersModule {}
