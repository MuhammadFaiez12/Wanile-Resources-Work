import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly config: ConfigService) {}

  @Post()
  verify(@Body('pin') pin: string) {
    const expected = this.config.get<string>('DASHBOARD_PIN', '2024');
    if (!pin) throw new UnauthorizedException('PIN required');
    return { ok: pin === expected };
  }
}
