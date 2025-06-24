import { IsString } from 'class-validator';

export class ManualPaymentDto {
  @IsString()
  orderId: string;

  @IsString()
  transactionId: string;
}
