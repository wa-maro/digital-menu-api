import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import { PaymentStatus } from 'src/orders/schemas/order.schema';

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  status: PaymentStatus;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
