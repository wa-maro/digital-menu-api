import { IsOptional, IsString, IsNotEmpty } from 'class-validator';

export class ManualPaymentConfirmationDto {
  @IsString()
  @IsOptional()
  transactionId?: string;

  @IsString()
  @IsNotEmpty({ message: 'phoneNumber is required' })
  phoneNumber: string;
}
