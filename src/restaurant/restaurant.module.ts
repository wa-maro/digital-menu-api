import { Module } from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { PublicRestaurantController } from './public-restaurant.controller';
import { AdminRestaurantController } from './admin-restaurant.controller';
import { Restaurant, RestaurantSchema } from './schemas/restaurant.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Restaurant.name, schema: RestaurantSchema },
    ]),
  ],
  providers: [RestaurantService],
  controllers: [PublicRestaurantController, AdminRestaurantController],
  exports: [MongooseModule],
})
export class RestaurantModule {}
