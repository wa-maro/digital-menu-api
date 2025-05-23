import { IsMongoId, IsNumber, Min } from 'class-validator';

export class OrderItemDto {
  @IsMongoId({ message: 'itemId must be a valid MongoDB ObjectId' })
  itemId: string;

  @IsNumber()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  customization?: any;

  @IsNumber()
  price: number;
}
