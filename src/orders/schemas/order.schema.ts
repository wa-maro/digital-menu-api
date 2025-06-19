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

export enum SelectedNetwork {
  MPESA = 'mpesa',
  TIGOPESA = 'tigopesa',
  AIRTEL_MONEY = 'airtel-money',
}

@Schema({ _id: false })
class PaymentDetails {
  @Prop({ enum: SelectedNetwork })
  selectedNetwork?: SelectedNetwork;

  @Prop()
  phoneNumber?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  tableNumber?: string;

  @Prop()
  pickupTime?: string;

  @Prop()
  deliveryAddress?: string;
}

const PaymentDetailsSchema = SchemaFactory.createForClass(PaymentDetails);

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({
    enum: OrderType,
    default: OrderType.DINE_IN,
    required: true,
  })
  type: OrderType;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus;

  @Prop({ enum: PaymentMethod })
  paymentMethod: PaymentMethod;

  @Prop({ type: PaymentDetailsSchema })
  paymentDetails?: PaymentDetails;

  @Prop({ required: true })
  total: number;

  @Prop() confirmedAt?: Date;
  @Prop() preparedAt?: Date;
  @Prop() deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
