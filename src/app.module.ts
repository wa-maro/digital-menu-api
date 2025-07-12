import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersModule } from './orders/orders.module';
import { CartModule } from './cart/cart.module';
import { PaymentsModule } from './payments/payments.module';
import { DashboardService } from './dashboard/dashboard.service';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardModule } from './dashboard/dashboard.module';
import Joi from 'joi';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().min(10).required().label('JWT_SECRET'),
        JWT_EXPIRES_IN: Joi.string().default('7d'),
      }),
    }),
    MongooseModule.forRoot(process.env.MONGODB_URI || ''),
    UserModule,
    AuthModule,
    MenuModule,
    OrdersModule,
    CartModule,
    PaymentsModule,
    DashboardModule,
  ],
  providers: [DashboardService],
  controllers: [DashboardController],
})
export class AppModule {}
