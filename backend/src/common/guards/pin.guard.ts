import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PinGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const pin =
      req.headers['x-pm-pin'] ||
      req.body?.pin ||
      req.query?.pin;

    const expected = this.config.get<string>('DASHBOARD_PIN', '2024');
    if (pin !== expected) throw new UnauthorizedException('Invalid PIN');
    return true;
  }
}
