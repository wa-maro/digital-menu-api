import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PaymentStatus } from '../schema/payment.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus, {
    message: `status must be one of: pending, pending_confirmation, paid, failed, cancelled, manual_review, timeout`,
  })
  status: PaymentStatus;

  @IsOptional()
  @IsDateString({}, { message: 'paidAt must be a valid ISO 8601 date string' })
  paidAt?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
