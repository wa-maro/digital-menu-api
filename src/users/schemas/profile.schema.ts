import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

@Schema({ timestamps: true })
export class Profile {
  @Prop({ required: true })
  fullName: string;

  @Prop()
  phoneNumber?: string;

  @Prop()
  address?: string;

  @Prop()
  avatarUrl?: string;

  @Prop({ enum: Gender, required: false })
  gender?: Gender;

  @Prop()
  dateOfBirth?: Date;
}

export type ProfileDocument = Profile & Document;

export const ProfileSchema = SchemaFactory.createForClass(Profile);
