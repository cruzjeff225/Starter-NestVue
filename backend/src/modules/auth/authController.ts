import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './authService';
import { LoginDto } from './dto/loginDto';
import { RegisterDto } from './dto/registerDto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto.nombre, dto.email, dto.contraseña);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.contraseña);
  }
}
