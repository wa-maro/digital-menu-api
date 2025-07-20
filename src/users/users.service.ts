import { Injectable } from '@nestjs/common';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Profile.name) private profileModel: Model<ProfileDocument>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<UserDocument> {
    const { email, password, fullName } = createUserDto;

    const profile = await this.profileModel.create({ fullName });

    const user = new this.userModel({
      email,
      passwordHash: password,
      role: UserRole.CUSTOMER,
      profile: new Types.ObjectId(String(profile._id)),
    });

    return await user.save();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email });
  }
}
