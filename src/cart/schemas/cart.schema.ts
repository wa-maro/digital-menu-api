import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({ timestamps: true })
export class Cart {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  @Prop([
    {
      item: { type: Types.ObjectId, ref: 'MenuItem' },
      quantity: Number,
      customizations: Object,
      price: Number,
    },
  ])
  items: {
    item: Types.ObjectId;
    quantity: number;
    customizations?: any;
    price: number;
  }[];

  @Prop()
  promoCode?: string;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
