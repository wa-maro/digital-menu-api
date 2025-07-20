import { Injectable, NotFoundException } from '@nestjs/common';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Profile, ProfileDocument } from './schemas/profile.schema';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async updateOrCreateProfile(
    userId: string,
    profileDto: UpdateProfileDto,
  ): Promise<Profile> {
    const user = await this.userModel.findById(new Types.ObjectId(userId));
    if (!user) throw new NotFoundException('User not found');

    if (!user.profile) {
      const profile = await this.profileModel.create(profileDto);

      user.profile = new Types.ObjectId(String(profile._id));
      await user.save();

      return profile;
    } else {
      const profile = await this.profileModel.findByIdAndUpdate(
        user.profile,
        profileDto,
        { new: true },
      );

      if (!profile) throw new NotFoundException('Profile not found');
      return profile;
    }
  }

  async findUserWithProfile(userId: string): Promise<UserDocument> {
    const user = await this.userModel
      .findById(userId)
      .select('email role profile')
      .populate('profile')
      .exec();

    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return await this.userModel.findOne({ email }).exec();
  }

  async findCustomers() {
    return await this.userModel
      .find({ role: UserRole.CUSTOMER })
      .select('-passwordHash -permissions')
      .populate('profile')
      .exec();
  }
}
