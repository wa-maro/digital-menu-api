import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsUrl,
  IsPhoneNumber,
} from 'class-validator';
import { Gender } from '../schemas/profile.schema';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;
}
