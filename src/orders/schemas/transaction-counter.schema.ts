import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type TransactionCounterDocument = TransactionCounter & Document;

@Schema()
export class TransactionCounter {
  @Prop({ required: true, unique: true })
  month: string;

  @Prop({ required: true })
  lastNumber: number;
}

export const TransactionCounterSchema =
  SchemaFactory.createForClass(TransactionCounter);
