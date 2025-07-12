import { IsMongoId, IsOptional, IsString } from 'class-validator';

export class PaymentStatusQueryDto {
  @IsOptional()
  @IsMongoId({ message: 'orderId must be a valid MongoDB ObjectId' })
  orderId?: string;

  @IsOptional()
  @IsString()
  transactionId?: string;

  // At least one of orderId or transactionId should be provided - enforce in service/controller
}
