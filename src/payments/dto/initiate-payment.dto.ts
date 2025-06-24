import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  PaymentMethod,
  SelectedNetwork,
} from 'src/orders/schemas/order.schema';

export class InitiatePaymentDto {
  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be one of the defined PaymentMethod values',
  })
  paymentMethod: PaymentMethod;

  @IsEnum(SelectedNetwork, {
    message: 'selectedNetwork must be one of: mpesa, tigopesa, airtel-money',
  })
  selectedNetwork: SelectedNetwork;

  @IsString()
  phoneNumber: string;

  @IsOptional()
  @IsString()
  sessionId?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
