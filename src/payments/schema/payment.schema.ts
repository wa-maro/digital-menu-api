import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  CASH = 'cash',
  LIPA_NAMBA = 'lipa_namba',
  AZAMPESA = 'azampesa',
}

export enum SelectedNetwork {
  MPESA = 'mpesa',
  TIGOPESA = 'tigopesa',
  AIRTEL_MONEY = 'airtel-money',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  order: Types.ObjectId;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop({ enum: SelectedNetwork })
  selectedNetwork?: SelectedNetwork;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING_CONFIRMATION })
  status: PaymentStatus;

  @Prop({ required: true, min: 0 })
  amount: number;

  @Prop()
  phoneNumber?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  message?: string;

  @Prop({ type: [{ status: String, timestamp: Date, message: String }] })
  logs: { status: string; timestamp: Date; message?: string }[];
}

export type PaymentDocument = Payment & Document;

export const PaymentSchema = SchemaFactory.createForClass(Payment);
