import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Currency,
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentProvider,
  PaymentStatus,
} from './schema/payment.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { TransactionCounterService } from './transaction-counter.service';
import { OrderStatus } from 'src/orders/schemas/order.schema';
import { canPaymentStatusTransit } from './utils/payment-status.transition';
import { OrdersService } from 'src/orders/orders.service';
import { ConfigService } from '@nestjs/config';
import { AzamPayCheckoutDto } from './dto/azampay-checkout.dto';
import { AzamPayCheckoutResponseDto } from './dto/azampay-checkout-response.dto';
import { AzamCallbackDto } from './dto/azampay-callback.dto';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly transactionCounterService: TransactionCounterService,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
    private readonly configService: ConfigService,
  ) {}

  async initializeCashPayment(orderId: Types.ObjectId, amount: number) {
    // Generate transactionId if not provided (for cash)
    const transactionId =
      await this.transactionCounterService.getNextTransactionNumber();

    const payment = new this.paymentModel({
      transactionId,
      order: orderId,
      paymentMethod: PaymentMethod.CASH,
      status: PaymentStatus.PENDING_CONFIRMATION,
      amount,
      logs: [
        {
          status: PaymentStatus.PENDING_CONFIRMATION,
          timestamp: new Date(),
          message: `TxID: ${transactionId} - Cash payment initialized.`,
        },
      ],
    });

    return await payment.save();
  }

  async confirmCashPayment(orderId: string) {
    if (!isValidObjectId(orderId))
      throw new BadRequestException('Invalid order ID');

    const order = await this.ordersService.getOrderByIdForAdmin(orderId);

    const payment = await this.paymentModel.findOne({
      order: new Types.ObjectId(orderId),
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
      message: `TxID: ${payment.transactionId} - Cash payment confirmed.`,
    });

    await payment.save();

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
        select: 'orderNumber',
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPaymentById(id: string) {
    const payment = await this.paymentModel
      .findById(id)
      .populate({
        path: 'order',
        populate: {
          path: 'user',
          select: 'profile email',
          populate: {
            path: 'profile',
            select: 'fullName',
          },
        },
      })
      .exec();

    if (!payment) throw new NotFoundException(`Payment ${id} not found`);

    return payment;
  }

  async updatePaymentStatus(id: string, nextStatus: PaymentStatus) {
    const payment = await this.paymentModel.findById(id);
    if (!payment)
      throw new NotFoundException(`Payment with ID ${id} not found`);

    if (payment.status === nextStatus) {
      return payment;
    }

    const isValidNext = canPaymentStatusTransit(
      payment.status,
      nextStatus,
      PaymentMethod.CASH,
    );

    if (!isValidNext)
      throw new BadRequestException(
        `Invalid status transition from ${payment.status} to ${nextStatus}`,
      );
    const now = new Date();

    payment.status = nextStatus;
    payment.logs.push({
      status: payment.status,
      timestamp: now,
      message: `TxID: ${payment.transactionId} - payment was updated.`,
    });

    await payment.save();

    return payment;
  }

  async initializeOnlinePayment(
    orderId: Types.ObjectId,
    provider: PaymentProvider,
    accountNumber: string,
    amount: number,
  ) {
    const azamPesaResponse = await this.initiateAzamPayment({
      accountNumber,
      amount,
      currency: Currency.TZS,
      externalId: orderId.toString(),
      provider,
    });

    if (!azamPesaResponse.success) {
      throw new BadRequestException(
        `AzamPesa payment failed: ${azamPesaResponse.message}`,
      );
    }

    // Generate transactionId if not provided (for cash)
    const transactionId =
      await this.transactionCounterService.getNextTransactionNumber();

    const payment = new this.paymentModel({
      transactionId,
      azamTransactionId: azamPesaResponse.transactionId,
      order: orderId,
      paymentMethod: PaymentMethod.MOBILE_MONEY,
      status: PaymentStatus.PENDING,
      amount,
      accountNumber,
      provider,
      logs: [
        {
          status: PaymentStatus.PENDING,
          timestamp: new Date(),
          message: `TxID: ${transactionId} - Online payment request sent. Message: ${azamPesaResponse.message}`,
        },
      ],
    });

    return await payment.save();
  }

  private async initiateAzamPayment(
    dto: AzamPayCheckoutDto,
  ): Promise<AzamPayCheckoutResponseDto> {
    const baseURL = this.configService.get<string>('AZAMPAY_BASE_URL');
    const token = this.configService.get<string>('AZAMPAY_CLIENT_TOKEN');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    };

    const res = await fetch(`${baseURL}/azampay/mno/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });

    return await res.json();
  }

 async processIncomingCallback(payload: AzamCallbackDto) {
  const {
    transactionstatus,
    amount,
    reference,
    msisdn,
    operator,
    utilityref,
    transid,
    message,
  } = payload;

  const payment = await this.paymentModel.findOne({
    azamTransactionId: reference, // or transid, if used instead
    provider: operator,
    amount: Number(amount),
  });

  if (!payment) {
    throw new NotFoundException(
      `No payment record found for reference: ${reference}, operator: ${operator}`,
    );
  }

  // Guard: If already marked PAID, skip
  if (payment.status === PaymentStatus.PAID) {
    return { message: 'Payment already processed' };
  }

  const now = new Date();

  if (transactionstatus === 'success') {
    payment.status = PaymentStatus.PAID;
    payment.paidAt = now;

    payment.logs.push({
      status: PaymentStatus.PAID,
      timestamp: now,
      message: `Payment confirmed via AzamPay callback (ref: ${reference})`,
    });

    await payment.save();

    // Update the related order status to CONFIRMED
    await this.ordersService.updateOrderStatus(
      payment.order.toString(),
      OrderStatus.CONFIRMED,
    );

    // Optional: Confirm to AzamPay, if required
    await this.AzamCheckoutCallback(payload);
  } else {
    payment.status = PaymentStatus.FAILED;

    payment.logs.push({
      status: PaymentStatus.FAILED,
      timestamp: now,
      message: `AzamPay callback reported failure: ${message}`,
    });

    await payment.save();

    await this.ordersService.updateOrderStatus(
      payment.order.toString(),
      OrderStatus.FAILED,
    );
  }

  return { message: 'Callback processed', status: payment.status };
}


  async AzamCheckoutCallback(dto: AzamCallbackDto) {
    const baseURL = this.configService.get<string>('AZAMPAY_BASE_URL');
    const token = this.configService.get<string>('AZAMPAY_CLIENT_TOKEN');

    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token,
    };

    const res = await fetch(`${baseURL}/api/v1/Checkout/Callback`, {
      method: 'POST',
      headers,
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.log(errorBody);
      throw new Error(`AzamPay callback failed with status ${res.status}`);
    }

    return await res.json();
  }

  async generateToken() {
    const authURL = this.configService.get<string>('AZAMPAY_AUTH_URL');
    const appname = this.configService.get<string>('AZAMPAY_APPNAME');
    const clientId = this.configService.get<string>('AZAMPAY_CLIENT_ID');
    const clientSecret = this.configService.get<string>(
      'AZAMPAY_CLIENT_SECRET',
    );

    const dto = {
      appName: appname,
      clientId: clientId,
      clientSecret: clientSecret,
    };

    const res = await fetch(`${authURL}/AppRegistration/GenerateToken`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    const { data, message, success } = await res.json();

    return data.accessToken;
  }
}
