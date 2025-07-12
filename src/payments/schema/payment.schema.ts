import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, SchemaTypes, Types } from 'mongoose';
import {
  PaymentMethod,
  PaymentStatus,
  SelectedNetwork,
} from 'src/orders/schemas/order.schema';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, index: true })
  order: Types.ObjectId;

  @Prop({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ enum: SelectedNetwork })
  selectedNetwork: SelectedNetwork;

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

  @Prop()
  amount?: number;

  @Prop({ type: SchemaTypes.Mixed })
  responseData?: Record<string, any>;

  @Prop()
  retryCount?: number;

  @Prop()
  expiresAt?: Date;

  @Prop()
  isWebhookReceived?: boolean;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
