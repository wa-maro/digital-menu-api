import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency, PaymentProvider } from '../schema/payment.schema';
import { Type } from 'class-transformer';

export class AdditionalPropertiesDto {
  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;
}

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

  @ValidateNested()
  @Type(() => AdditionalPropertiesDto)
  additionalProperties: AdditionalPropertiesDto;
}
