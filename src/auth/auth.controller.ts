import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body.email, body.password);
  }

  @Post('setup')
  setup(@Body() body: { email: string; password: string }) {
    return this.auth.createInitialAdmin(body.email, body.password);
  }
}