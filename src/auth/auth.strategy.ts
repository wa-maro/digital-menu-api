import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

type PayloadType = {
  sub: string;
  email: string;
  role: 'customer' | 'manager' | 'admin';
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_SECRET', { infer: true })!,
    });
  }

  async validate(payload: PayloadType) {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
