import {
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { OrderType } from '../schemas/order.schema';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';

export class PlaceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(OrderType, {
    message: 'orderType must be one of: dine-in, takeaway, delivery',
  })
  type: string;

  @IsOptional()
  @IsString()
  deliveryAddress?: string;
}
