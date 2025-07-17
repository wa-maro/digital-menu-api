import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from './schema/payment.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { TransactionCounterService } from './transaction-counter.service';
import { OrderStatus } from 'src/orders/schemas/order.schema';
import { canPaymentStatusTransit } from './utils/payment-status.transition';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly transactionCounterService: TransactionCounterService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async initializeCashPayment(
    orderId: Types.ObjectId,
    amount: number,
    phoneNumber: string,
  ) {
    // Generate transactionId if not provided (for cash)
    const transactionId =
      await this.transactionCounterService.getNextTransactionNumber();

    const payment = new this.paymentModel({
      transactionId,
      order: orderId,
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.PENDING_CONFIRMATION,
      amount,
      phoneNumber,
      logs: [
        {
          status: PaymentStatus.PENDING_CONFIRMATION,
          timestamp: new Date(),
          message: `Cash payment initialized. TxID: ${transactionId}, Phone: ${phoneNumber}. Awaiting manual confirmation.`,
        },
      ],
    });

    return await payment.save();
  }

  async confirmCashPayment(orderId: string) {
    if (!isValidObjectId(orderId))
      throw new BadRequestException('Invalid order ID');

    const order = await this.ordersService.getOrderByIdForAdmin(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const payment = await this.paymentModel.findOne({
      order: orderId,
      paymentMethod: PaymentMethod.CASH,
    });
    if (!payment)
      throw new NotFoundException('Cash payment not found for this order');

    const currentStatus = payment.status;
    const nextStatus = PaymentStatus.PAID;

    const isValidNext = canPaymentStatusTransit(
      currentStatus,
      nextStatus,
      PaymentMethod.CASH,
    );

    if (!isValidNext) {
      throw new BadRequestException(
        `Invalid payment status transition from ${currentStatus} to ${nextStatus}`,
      );
    }

    // Update payment details
    const now = new Date();

    payment.status = PaymentStatus.PAID;
    payment.paidAt = now;

    payment.logs.push({
      status: PaymentStatus.PAID,
      timestamp: now,
      message: `Cash payment confirmed. TxID: ${payment.transactionId}, Phone: ${payment.phoneNumber}`,
    });

    await this.ordersService.updateOrderStatus(orderId, OrderStatus.CONFIRMED);

    return {
      message: 'Cash payment confirmed successfully',
      orderNumber: order.orderNumber,
      transactionId: payment.transactionId,
      orderStatus: order.status,
      paymentStatus: payment.status,
    };
  }

  async getUserPaymentById(id: string, userId: string) {
    const payment = await this.paymentModel.findOne({ _id: id, user: userId });
    if (!payment)
      throw new NotFoundException(`Payment ${id} not found for this user`);

    return {
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      method: payment.paymentMethod,
      paidAt: payment.paidAt,
      order: payment.order._id,
    };
  }

  async getUserPayments(userId: string) {
    const payments = await this.paymentModel.find({ user: userId });
    return payments.map((payment) => ({
      _id: payment._id,
      amount: payment.amount,
      status: payment.status,
      method: payment.paymentMethod,
      paidAt: payment.paidAt,
      order: payment.order?._id,
    }));
  }

  async getPayments() {
    return await this.paymentModel
      .find()
      .populate({
        path: 'order',
        populate: { path: 'user' }, // Populates order.user as full object
      })
      .lean()
      .exec();
  }

  async getPaymentById(id: string) {
    const payment = await this.paymentModel
      .findById(id)
      .populate({
        path: 'order',
        populate: { path: 'user' },
      })
      .lean()
      .exec();

    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    return payment;
  }
}
