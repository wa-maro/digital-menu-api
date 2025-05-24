import {
  IsMongoId,
  IsNumber,
  IsObject,
  IsOptional,
  Min,
} from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsObject()
  customization?: any;

  @IsNumber()
  @Min(1, { message: 'quantity must be at least 1' })
  quantity: number;

  @IsNumber()
  price: number;
}
