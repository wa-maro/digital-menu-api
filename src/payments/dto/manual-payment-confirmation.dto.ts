import { IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class ManualPaymentConfirmationDto {
  @IsMongoId({ message: 'orderId must be a valid MongoDB ObjectId' })
  orderId: string;

  @IsString()
  @IsNotEmpty({ message: 'transactionId is required' })
  transactionId: string;

  @IsString()
  @IsNotEmpty({ message: 'phoneNumber is required' })
  phoneNumber: string;
}
