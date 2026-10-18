import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'lanhdao.an', description: 'Tên đăng nhập hệ thống' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @ApiProperty({ example: 'MatKhau@2026!', description: 'Mật khẩu bảo mật' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: '123456', description: 'Mã xác thực 2 bước TOTP (nếu đã kích hoạt)', required: false })
  @IsOptional()
  @IsString()
  twoFactorCode?: string;
}
