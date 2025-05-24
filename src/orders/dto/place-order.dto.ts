import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
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

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsNotEmpty({ message: 'Delivery address is required for derlivery orders' })
  @IsString()
  deliveryAddress?: string;
}
