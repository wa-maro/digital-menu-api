import {
  ConflictException,
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

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtservice: JwtService,
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

  private signPayload(user: UserDocument) {
    const payload = { sub: user._id, email: user.email, role: user.role };

    return {
      accessToken: this.jwtservice.sign(payload),
      role: user.role,
    };
  }
}
