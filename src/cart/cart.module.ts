import { Module } from '@nestjs/common';
import { CustomerCartController } from './customer-cart.controller';
import { AdminCartController } from './admin-cart.controller';
import { CartService } from './cart.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Cart, CartSchema } from './schemas/cart.schema';
import { OrdersModule } from 'src/orders/orders.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Cart.name, schema: CartSchema }]),
    OrdersModule,
  ],
  controllers: [CustomerCartController, AdminCartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
