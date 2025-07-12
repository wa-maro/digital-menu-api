import {
  IsNotEmpty,
  IsString,
  IsUrl,
  IsMongoId,
  IsOptional,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UploadMediaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsMongoId()
  @IsNotEmpty()
  category: string;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  linkedMenuItemIds?: string[];
}
