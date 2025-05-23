import { IsMongoId, IsNumber, IsString } from 'class-validator';

export class CreateItemDto {
  @IsString()
  name: string;

  @IsString()
  description?: string;

  @IsNumber()
  price: number;

  @IsMongoId()
  category: string;
}
