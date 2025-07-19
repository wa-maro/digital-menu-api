import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Max,
  Min,
} from 'class-validator';
import { Currency, PaymentProvider } from '../schema/payment.schema';

export class AzamPayCheckoutDto {
  @IsString()
  @IsNotEmpty()
  accountNumber: string; // MSISDN (e.g. phone number)

  @IsNumber()
  @Min(0)
  @Max(5000000)
  @IsNotEmpty()
  amount: number;

  @IsEnum(Currency)
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  externalId: string;

  @IsEnum(PaymentProvider)
  @IsNotEmpty()
  provider: PaymentProvider;
}
