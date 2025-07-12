import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderItem, OrderItemSchema } from './order-item.schema';

export type OrderDocument = Order & Document;

export enum OrderType {
  DINE_IN = 'dine-in',
  TAKEAWAY = 'takeaway',
  DELIVERY = 'delivery',
}

export enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PREPARING = 'preparing',
  READY = 'ready',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  PICKED = 'picked',
  COMPLETED = 'completed',
  CANCEL_REQUEST = 'cancel_request',
  CANCELLED = 'cancelled',
  REJECTED_CANCEL_REQUEST = 'rejected_cancel_request',
  FAILED = 'failed',
}

export enum PaymentMethod {
  CASH = 'cash',
  LIPA_NAMBA = 'lipa_namba',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PENDING_CONFIRMATION = 'pending_confirmation',
  PAID = 'paid',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  MANUAL_REVIEW = 'manual_review',
  TIMEOUT = 'timeout',
}

export enum SelectedNetwork {
  MPESA = 'mpesa',
  TIGOPESA = 'tigopesa',
  AIRTEL_MONEY = 'airtel-money',
  AZAMPESA = 'azampesa',
}

@Schema({ _id: false })
class DeliveryLocation {
  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  address: string;
}

@Schema({ _id: false })
class PaymentDetails {
  @Prop({ enum: SelectedNetwork })
  selectedNetwork?: SelectedNetwork;

  @Prop()
  phoneNumber?: string;

  @Prop()
  transactionId?: string; // TODO:for AzamPesa reference

  @Prop()
  paymentSessionId?: string; // TODO: if provided by AzamPay

  @Prop()
  paidAt?: Date;

  @Prop()
  userEnteredTransactionId?: string; // TODO: for fallback/manual entry

  @Prop()
  contactPhone?: string;

  @Prop()
  tableNumber?: string;

  @Prop()
  pickupTime?: string;

  @Prop()
  deliveryAddress?: string;

  @Prop({ type: DeliveryLocation })
  deliveryLocation?: DeliveryLocation;

  @Prop()
  payerName?: string;

  @Prop()
  merchantRef?: string;
}

const PaymentDetailsSchema = SchemaFactory.createForClass(PaymentDetails);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ enum: OrderType, default: OrderType.DINE_IN, required: true })
  type: OrderType;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus;

  @Prop({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  paymentStatus: PaymentStatus;

  @Prop({ type: [{ status: String, timestamp: Date, message: String }] })
  paymentLog?: { status: string; timestamp: Date; message?: string }[];

  @Prop({ type: PaymentDetailsSchema })
  paymentDetails?: PaymentDetails;

  @Prop({ required: true })
  total: number;

  @Prop() confirmedAt?: Date;
  @Prop() preparedAt?: Date;
  @Prop() deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
