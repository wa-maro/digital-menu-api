import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderItemDocument = OrderItem & Document;

@Schema({ timestamps: true })
export class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'MenuItem', required: true })
  item: Types.ObjectId;

  @Prop({ type: Object })
  customizations: any;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  price: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
