import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'chuyenvien.thang@kpi.gov.vn', description: 'Địa chỉ Email đăng ký tài khoản' })
  @IsEmail({}, { message: 'Địa chỉ Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: 'Mã token khôi phục mật khẩu nhận được' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'MatKhauMoi@2026!', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  newPassword: string;
}
