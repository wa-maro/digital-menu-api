import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPhoneNumber,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './order-item.dto';
import { OrderType } from '../schemas/order.schema';
import {
  PaymentMethod,
  PaymentProvider,
} from 'src/payments/schema/payment.schema';

class DeliveryLocationDto {
  @IsNotEmpty()
  @IsNumber()
  lng: number;

  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @IsNotEmpty()
  @IsString()
  address: string;
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

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  paymentMethod: PaymentMethod;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MOBILE_MONEY)
  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.MOBILE_MONEY)
  @IsPhoneNumber('TZ')
  @IsNotEmpty()
  accountNumber: string;

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

  @ValidateIf((o) => o.type === OrderType.DELIVERY)
  @ValidateNested()
  @Type(() => DeliveryLocationDto)
  @IsNotEmpty({ message: 'Delivery location is required for delivery orders' })
  deliveryLocation?: DeliveryLocationDto;

  @ValidateIf(
    (o) => o.type === OrderType.DELIVERY || o.type === OrderType.TAKEAWAY,
  )
  @IsNotEmpty({ message: 'Contact phone is required' })
  @IsPhoneNumber('TZ', {
    message: 'contactPhone must be a valid Tanzanian number',
  })
  @IsOptional()
  contactPhone: string;
}
