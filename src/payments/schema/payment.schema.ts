import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum PaymentMethod {
  CASH = 'cash',
  MOBILE_MONEY = 'mobile_money',
}

export enum PaymentProvider {
  Mpesa = 'Mpesa',
  Tigo = 'Tigo',
  Airtel = 'Airtel',
  Halopesa = 'Halopesa',
  Azampesa = 'Azampesa',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PAID = 'paid',
  REFUNDED = 'refunded',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export enum Currency {
  TZS = 'TZS',
  USD = 'USD',
  KES = 'KES',
}

export interface AdditionalProperties {
  transactionId?: string;
  orderId?: string;
}

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true })
  transactionId: string;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  order: Types.ObjectId;

  @Prop({ enum: PaymentMethod, default: PaymentMethod.CASH })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentProvider })
  provider?: PaymentProvider;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING_CONFIRMATION })
  status: PaymentStatus;

  @Prop({ required: true, min: 0, max: 5000000 })
  amount: number;

  @Prop()
  currency?: Currency;

  @Prop()
  azamTransactionId?: string;

  @Prop()
  accountNumber?: string;

  @Prop()
  paidAt?: Date;

  @Prop()
  message?: string;

  @Prop({
    type: {
      transactionId: { type: String },
      orderId: { type: String },
    },
    required: false,
  })
  additionalProperties?: AdditionalProperties;

  @Prop({ type: [{ status: String, timestamp: Date, message: String }] })
  logs: { status: string; timestamp: Date; message?: string }[];
}

export type PaymentDocument = Payment & Document;

export const PaymentSchema = SchemaFactory.createForClass(Payment);
