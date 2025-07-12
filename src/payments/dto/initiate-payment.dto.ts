import { IsEnum, IsOptional, IsPhoneNumber, IsString } from 'class-validator';
import {
  PaymentMethod,
  SelectedNetwork,
} from 'src/orders/schemas/order.schema';

export class InitiatePaymentDto {
  @IsEnum(PaymentMethod, {
    message: 'paymentMethod must be one of: cash, lipa_namba',
  })
  paymentMethod: PaymentMethod;

  @IsEnum(SelectedNetwork, {
    message:
      'selectedNetwork must be one of: mpesa, tigopesa, airtel-money, azampesa',
  })
  selectedNetwork: SelectedNetwork;

  @IsPhoneNumber('TZ', {
    message: 'phoneNumber must be a valid Tanzanian number',
  })
  phoneNumber: string;

  @IsOptional()
  @IsString()
  sessionId?: string; // Optional if reused or coming from frontend for retry

  @IsOptional()
  @IsString()
  message?: string;
}
