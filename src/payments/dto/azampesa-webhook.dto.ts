import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export enum AzamPesaPaymentStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
}

export class AzamPesaWebhookDto {
  @IsString()
  @IsNotEmpty()
  transactionId: string; // Unique AzamPesa transaction reference

  @IsString()
  @IsNotEmpty()
  sessionId: string; // Payment session ID to correlate with your system

  @IsEnum(AzamPesaPaymentStatus)
  status: AzamPesaPaymentStatus;

  @IsNumber()
  amount: number;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string; // Payer phone number

  @IsDateString()
  paidAt: string;

  @IsOptional()
  @IsString()
  message?: string; // Optional message or description

  @IsOptional()
  @IsString()
  signature?: string; // If AzamPesa provides webhook signature for validation
}
