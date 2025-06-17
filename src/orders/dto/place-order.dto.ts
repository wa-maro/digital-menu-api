import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';
import {
  OrderType,
  PaymentMethod,
  SelectedNetwork,
} from '../schemas/order.schema';

class PaymentDetailsDto {
  @IsOptional()
  @IsEnum(SelectedNetwork, {
    message: 'selectedNetwork must be one of: Mpesa, tigopesa',
  })
  selectedNetwork?: SelectedNetwork;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ValidateIf((o) => o.type === OrderType.DINE_IN)
  @IsNotEmpty({ message: 'Table number is required for dine-in orders' })
  @IsString()
  tableNumber?: string;

  @ValidateIf((o) => o.type === OrderType.TAKEAWAY)
  @IsNotEmpty({ message: 'Pickup time is required for takeaway orders' })
  @IsString()
  pickupTime?: string;

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @IsNotEmpty({ message: 'Delivery address is required for delivery orders' })
  @IsString()
  deliveryAddress?: string;
}

export class PlaceOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(OrderType, {
    message: 'type must be one of: dine-in, takeaway, delivery',
  })
  type: OrderType;

  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be one of: cash, lipa_namba',
  })
  paymentMethod: PaymentMethod;

  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentDetailsDto)
  paymentDetails?: PaymentDetailsDto;
}
