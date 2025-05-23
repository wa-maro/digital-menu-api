import { IsMongoId, IsNumber, IsObject, IsOptional } from 'class-validator';

export class AddToCartDto {
  @IsMongoId()
  itemId: string;

  @IsOptional()
  @IsObject()
  customization?: any;

  @IsNumber()
  quantity: number;
}
