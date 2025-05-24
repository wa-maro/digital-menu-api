import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Cart, CartSchema } from 'src/cart/schemas/cart.schema';
import { CartController } from 'src/cart/cart.controller';
import { CartService } from 'src/cart/cart.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Cart.name, schema: CartSchema },
    ]),
  ],
  controllers: [OrdersController, CartController],
  providers: [OrdersService, CartService],
})
export class OrdersModule {}
