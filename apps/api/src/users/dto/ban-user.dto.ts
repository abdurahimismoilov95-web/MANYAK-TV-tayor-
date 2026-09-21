import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BanUserDto {
  @ApiProperty({ description: 'Reason for banning' })
  @IsString()
  reason: string;
}
