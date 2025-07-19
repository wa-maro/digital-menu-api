import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  DayOfWeek,
  Restaurant,
  RestaurantDocument,
} from './schemas/restaurant.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';

const SINGLETON_ID = 'singleton';

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

  async upsertRestaurant(dto: CreateRestaurantDto): Promise<Restaurant> {
    if (dto.workingHours) this.validateWorkingHoursDays(dto.workingHours);

    return this.restaurantModel.findByIdAndUpdate(SINGLETON_ID, dto, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }

  private validateWorkingHoursDays(workingHours: Record<string, any>) {
    const validDays = Object.values(DayOfWeek);
    for (const day of Object.keys(workingHours || {})) {
      if (!validDays.includes(day as DayOfWeek)) {
        throw new BadRequestException(`Invalid day in workingHours: ${day}`);
      }
    }
  }
}
