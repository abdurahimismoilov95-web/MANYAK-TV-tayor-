import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GrantVipDto {
  @ApiProperty({ description: 'VIP duration in days', example: 30 })
  @IsInt()
  @Min(1)
  durationDays: number;
}
