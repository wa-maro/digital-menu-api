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

class DeliveryLocationDto {
  @IsNotEmpty()
  lng: number;

  @IsNotEmpty()
  lat: number;

  @IsNotEmpty()
  @IsString()
  address: string;
}

class PaymentDetailsDto {
  @IsOptional()
  @IsEnum(SelectedNetwork, {
    message: 'selectedNetwork must be one of: Mpesa, tigopesa',
  })
  selectedNetwork?: SelectedNetwork;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  transactionId?: string; // AzamPesa transaction reference (after confirmation)

  @IsOptional()
  @IsString()
  paymentSessionId?: string; // If returned by AzamPesa when initiating payment

  // @IsOptional()
  // @IsString()
  // userEnteredTransactionId?: string; // For manual fallback entry

  @IsOptional()
  @IsString()
  contactPhone?: string; // Optional contact number for delivery/communication

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
  deliveryLocation?: DeliveryLocationDto;
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
