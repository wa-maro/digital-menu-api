import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import {
  PaymentMethod,
  PaymentStatus,
  SelectedNetwork,
} from 'src/orders/schemas/order.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  order: Types.ObjectId;

  @Prop({ enum: PaymentMethod })
  method: PaymentMethod;

  @Prop({ enum: SelectedNetwork })
  network: SelectedNetwork;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop()
  transactionId?: string;

  @Prop()
  sessionId?: string;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Prop()
  message?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  userEnteredTransactionId?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
