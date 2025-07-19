import {
  IsString,
  IsOptional,
  IsEnum,
  ValidateNested,
  IsObject,
  IsNotEmpty,
  IsDefined,
} from 'class-validator';
import { Type } from 'class-transformer';
import { DayOfWeek } from 'src/restaurant/schemas/restaurant.schema';

class DayHoursDto {
  @IsDefined()
  @IsString()
  open: string;

  @IsDefined()
  @IsString()
  close: string;
}

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  brandLogo?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(DayOfWeek, { each: true })
  workingDays?: DayOfWeek[];

  @IsOptional()
  @IsObject()
  @ValidateNested({ each: true })
  @Type(() => DayHoursDto)
  workingHours?: Partial<Record<DayOfWeek, DayHoursDto>>;
}
