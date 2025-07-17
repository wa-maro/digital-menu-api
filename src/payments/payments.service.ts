import {
  BadRequestException,
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
import { isValidObjectId, Model } from 'mongoose';
import { canPaymentStatusTransit } from './utils/payment-status.transition';
import { ManualPaymentConfirmationDto } from './dto/manual-payment-confirmation.dto';
import { TransactionCounterService } from './transaction-counter.service';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly transactionCounterService: TransactionCounterService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,

    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async confirmManualPayment(
    orderId: string,
    dto: ManualPaymentConfirmationDto,
  ) {
    if (!isValidObjectId(orderId))
      throw new BadRequestException('Invalid order ID');

    const order = await this.orderModel.findOne({ _id: orderId });
    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.paymentStatus;
    const nextStatus = PaymentStatus.PAID;

    const isValidNext = canPaymentStatusTransit(
      currentStatus,
      nextStatus,
      PaymentMethod.CASH,
    );

    if (!isValidNext)
      throw new BadRequestException(
        `Invalid payment status transition from ${currentStatus} to ${nextStatus}`,
      );

    // Generate transactionId if not provided (for cash)
    const transactionId =
      dto.transactionId ||
      (await this.transactionCounterService.getNextTransactionNumber());

    const now = new Date();

    order.paymentStatus = nextStatus;
    order.paymentDetails = {
      ...(order.paymentDetails || {}),
      userEnteredTransactionId: transactionId,
      phoneNumber: dto.phoneNumber,
      paidAt: now,
    };

    order.paymentLog = [
      ...(order.paymentLog || []),
      {
        status: nextStatus,
        timestamp: now,
        message: `Manual payment confirmed. TxID: ${transactionId}, Phone: ${dto.phoneNumber}`,
      },
    ];

    await order.save();

    return {
      message: 'Manual payment confirmed',
      orderId: order.orderId,
      transactionId,
    };
  }
}
