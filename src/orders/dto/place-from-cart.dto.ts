import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { OrderType } from '../schemas/order.schema';

export class PlaceFromCartDto {
  @IsEnum(OrderType, {
    message: 'orderType must be one of: dine-in, takeaway, delivery',
  })
  type: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsNotEmpty({ message: 'Delivery address is required for derlivery orders' })
  @IsString()
  deliveryAddress?: string;
}
