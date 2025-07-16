import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type OrderCounterDocument = OrderCounter & Document;

@Schema()
export class OrderCounter {
  @Prop({ required: true, unique: true })
  month: string;

  @Prop({ required: true })
  lastNumber: number;
}

export const OrderCounterSchema = SchemaFactory.createForClass(OrderCounter);
