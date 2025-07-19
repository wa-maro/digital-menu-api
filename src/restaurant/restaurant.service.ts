import { Injectable, NotFoundException } from '@nestjs/common';
import { Restaurant, RestaurantDocument } from './schemas/restaurant.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectModel(Restaurant.name)
    private readonly restaurantModel: Model<RestaurantDocument>,
  ) {}

  async find(): Promise<Restaurant> {
    const restaurant = await this.restaurantModel.findOne();
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    return restaurant;
  }
}
