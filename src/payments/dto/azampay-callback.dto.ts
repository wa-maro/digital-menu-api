import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AdditionalPropertiesDto } from './azampay-checkout.dto';
import { Type } from 'class-transformer';

enum Operators {
  AIRTEL_MONEY = 'Airtel',
  TIGO_PESA = 'Tigo',
  HALOPESA = 'Halopesa',
  AZAMPESA = 'Azampesa',
  MPESA = 'Mpesa',
}

export class AzamCallbackPayloadDto {
  @IsString()
  @IsNotEmpty()
  msisdn: string;

  @IsString()
  @IsNotEmpty()
  amount: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsNotEmpty()
  utilityref: string;

  @IsEnum([Operators])
  operator: Operators;

  @IsString()
  @IsNotEmpty()
  reference: string;

  @IsEnum(['success', 'failure'])
  @IsNotEmpty()
  transactionstatus: 'success' | 'failure';

  @IsOptional()
  @IsString()
  submerchantAcc?: string;

  @IsOptional()
  @IsString()
  fspReferenceId?: string;

  @IsOptional()
  @IsString()
  externalreference?: string;

  @IsOptional()
  @IsString()
  transid?: string;

  @IsOptional()
  @IsString()
  mnoreference?: string;

  @ValidateNested()
  @Type(() => AdditionalPropertiesDto)
  additionalProperties: AdditionalPropertiesDto;
}
