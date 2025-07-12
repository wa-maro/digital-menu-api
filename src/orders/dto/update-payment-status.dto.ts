import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../schemas/order.schema';
import { Type } from 'class-transformer';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus, {
    message:
      'status must be one of: pending, pending_confirmation, paid, failed, cancelled, manual_review, timeout',
  })
  status: PaymentStatus;

  @IsOptional()
  @IsString()
  transactionId?: string;

  @IsOptional()
  @IsString()
  userEnteredTransactionId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'paidAt must be a valid ISO date string' })
  @Type(() => Date)
  paidAt?: Date;

  @IsOptional()
  @IsString()
  message?: string;
}
