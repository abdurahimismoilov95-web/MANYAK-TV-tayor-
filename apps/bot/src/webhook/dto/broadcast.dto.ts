import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BroadcastDto {
  @ApiProperty({ description: 'Broadcast message text' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Target user IDs', required: false })
  @IsArray()
  @IsOptional()
  targetUserIds?: string[];

  @ApiProperty({ description: 'Send to all users', default: false })
  @IsBoolean()
  @IsOptional()
  sendToAll?: boolean;

  @ApiProperty({ description: 'Send to VIP users only', default: false })
  @IsBoolean()
  @IsOptional()
  vipOnly?: boolean;
}
