import { IsNotEmpty, IsString, IsMongoId } from 'class-validator';

export class UploadMediaDto {
  @IsString()
  displayName: string;

  @IsMongoId()
  @IsNotEmpty()
  category: string;
}
