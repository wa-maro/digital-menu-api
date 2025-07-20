import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/users/schemas/user.schema';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './auth.strategy';
import { SharedModule } from 'src/shared.module';
import { UserModule } from 'src/users/user.module';

@Module({
  imports: [
    PassportModule,
    SharedModule,
    JwtModule.registerAsync({
      imports: [SharedModule, ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '7d',
        },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserModule,
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
