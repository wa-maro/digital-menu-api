import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Media extends Document {
  @Prop({ required: true, unique: true })
  displayName: string;

  @Prop({ required: true, unique: true })
  filename: string;

  @Prop({ required: true, unique: true })
  url: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'MenuItem', default: [] })
  linkedMenuItemIds: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  uploadedBy: Types.ObjectId;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
