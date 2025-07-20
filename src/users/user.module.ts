import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UsersController } from './users.controller';
import { Profile, ProfileSchema } from './schemas/profile.schema';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Profile.name, schema: ProfileSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [MongooseModule, UsersService],
})
export class UserModule {}
