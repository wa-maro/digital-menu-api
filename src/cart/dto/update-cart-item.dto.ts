import { IsMongoId, IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsMongoId()
  itemId: string;

  @IsNumber()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;
}
