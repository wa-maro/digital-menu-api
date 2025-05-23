import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from './users/user.module';
import { AuthModule } from './auth/auth.module';
import { MenuModule } from './menu/menu.module';
import { OrdersService } from './orders/orders.service';
import { OrdersModule } from './orders/orders.module';
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
