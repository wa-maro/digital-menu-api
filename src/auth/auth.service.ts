import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { User, UserDocument } from 'src/users/user.schema';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtservice: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async register(dto: RegisterDto) {
    try {
      // check if user already exist
      const existingUser = await this.userModel.findOne({ email: dto.email });
      if (existingUser) return new ConflictException('User already exists');

      // encrypt the password
      const hashed = await bcrypt.hash(dto.password, 10);

      // create a new user
      const user = await this.userModel.create({
        fullName: dto.fullName,
        email: dto.email,
        passwordHash: hashed,
      });

      // return registered user as a payload
      return this.signPayload(user);
    } catch (error) {
      console.log(error);
    }
  }

  async login(dto: LoginDto) {
    // check if user already exist
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user) return new ConflictException("User doesn't exists");

    // compare the password with stored hash
    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) return new UnauthorizedException('Wrong credentials');

    // return valid user as payload
    return this.signPayload(user);
  }

  async logout(token: string) {
    try {
      const secret = this.configService.get<string>('JWT_SECRET');
      if (!secret) throw new Error('JWT_SECRET is not configured.');

      const decoded: any = jwt.verify(token, secret);

      const exp = decoded.exp;
      if (!exp) throw new Error('Token does not have an expiration.');

      const ttl = exp - Math.floor(Date.now() / 1000);

      // Use hash of the token to avoid storing the whole token in Redis
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      await this.cacheManager.set(`blacklist_${tokenHash}`, true, ttl);

      return { message: 'Logged out successfully' };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.cacheManager.get(`blacklist_${token}`);
    return !!result;
  }

  private signPayload(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtservice.sign(payload),
      role: user.role,
    };
  }
}
