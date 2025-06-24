import {
  PaymentMethod,
  SelectedNetwork,
  PaymentStatus,
} from 'src/orders/schemas/order.schema';

export class PaymentResponseDto {
  _id: string;
  order: string;
  paymentMethod: PaymentMethod;
  selectedNetwork: SelectedNetwork;
  status: PaymentStatus;
  message?: string;
  createdAt: Date;
  updatedAt: Date;

  static from(payment: any): PaymentResponseDto {
    return {
      _id: payment._id,
      order: payment.order,
      paymentMethod: payment.paymentMethod,
      selectedNetwork: payment.selectedNetwork,
      status: payment.status,
      message: payment.message,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  }
}
