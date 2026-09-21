import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVerificationDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsString()
  telegramId: string;

  @ApiProperty({ description: 'Phone number with country code' })
  @IsString()
  phoneNumber: string;
}

export class VerifyCodeDto {
  @ApiProperty({ description: 'Telegram user ID' })
  @IsString()
  telegramId: string;

  @ApiProperty({ description: '6-digit verification code' })
  @IsString()
  code: string;
}
