import { IsNumber, Min } from 'class-validator';

export class UpdateCartItemDto {
  @IsNumber()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;
}
