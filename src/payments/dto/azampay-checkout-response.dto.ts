import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class AzamPayCheckoutResponseDto {
  @IsBoolean()
  success: boolean;

  @IsOptional()
  @IsString()
  message?: string | null;

  @IsOptional()
  @IsString()
  transactionId?: string | null;
}
