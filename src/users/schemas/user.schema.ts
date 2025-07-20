import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  CUSTOMER = 'customer',
  MANAGER = 'manager',
  ADMIN = 'admin',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ enum: UserRole, default: UserRole.CUSTOMER })
  role: UserRole;

  @Prop({ type: [String], default: [] })
  permissions: string[];

  @Prop({ type: Types.ObjectId, ref: 'Profile' })
  profile: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);
