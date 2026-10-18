import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Refresh token để cấp mới access token' })
  @IsString({ message: 'Refresh token phải là chuỗi hợp lệ' })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  refreshToken: string;
}
