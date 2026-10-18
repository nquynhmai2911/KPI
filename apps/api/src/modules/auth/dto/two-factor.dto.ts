import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Verify2faDto {
  @ApiProperty({ example: '123456', description: 'Mã xác thực 6 chữ số từ ứng dụng Google Authenticator' })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'Mã xác thực 2FA phải gồm đúng 6 chữ số' })
  code: string;
}
