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
  @Min(0)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;
}
