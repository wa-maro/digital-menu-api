import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  CASH = 'cash',
  AZAMPESA = 'azampesa',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  order: Types.ObjectId;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING_CONFIRMATION })
  status: PaymentStatus;

  @Prop({ required: true })
  phoneNumber: string;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  paidAt?: Date;

  @Prop()
  message?: string;
}

export type PaymentDocument = Payment & Document;

export const PaymentSchema = SchemaFactory.createForClass(Payment);
