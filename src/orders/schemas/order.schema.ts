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

@Schema({ _id: false })
class DeliveryLocation {
  @Prop({ required: true })
  lng: number;

  @Prop({ required: true })
  lat: number;

  @Prop({ required: true })
  address: string;
}

@Schema({ timestamps: true })
export class Order {
  @Prop({ required: true, unique: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Payment', required: true })
  payments: Types.ObjectId[];

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ enum: OrderType, default: OrderType.DINE_IN, required: true })
  type: OrderType;

  @Prop({ enum: OrderStatus, default: OrderStatus.PENDING, index: true })
  status: OrderStatus;

  @Prop({ required: true })
  total: number;

  // Dine-in info
  @Prop()
  tableNumber?: string;

  // Takeaway info
  @Prop()
  pickupTime?: string;

  // Delivery info
  @Prop()
  contactPhone: string;

  @Prop()
  deliveryAddress?: string;

  @Prop({ type: DeliveryLocation })
  deliveryLocation?: DeliveryLocation;

  @Prop() confirmedAt?: Date;
  @Prop() preparedAt?: Date;
  @Prop() deliveredAt?: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
