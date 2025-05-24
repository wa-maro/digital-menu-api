import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderType } from '../schemas/order.schema';

export class PlaceFromCartDto {
  @IsEnum(OrderType, {
    message: 'orderType must be one of: dine-in, takeaway, delivery',
  })
  type: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}
