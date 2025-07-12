import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';
import { Model } from 'mongoose';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentStatus } from 'src/orders/schemas/order.schema';
import { PaymentResponseDto } from './dto/payment-response.dto';
import {
  AzamPesaPaymentStatus,
  AzamPesaWebhookDto,
} from './dto/azampesa-webhook.dto';
import { OrdersService } from 'src/orders/orders.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    private readonly ordersService: OrdersService,
  ) {}

  async initiatePaymentRecord(
    orderId: string,
    dto: InitiatePaymentDto,
  ): Promise<PaymentDocument> {
    this.logger.log(
      `Initiating payment for order ${orderId} using ${dto.selectedNetwork} to phone ${dto.phoneNumber}`,
    );

    const payment = await this.paymentModel.create({
      order: orderId,
      paymentMethod: dto.paymentMethod,
      selectedNetwork: dto.selectedNetwork,
      phoneNumber: dto.phoneNumber,
      sessionId: dto.sessionId,
      status: PaymentStatus.PENDING,
      message: dto.message,
    });

    this.logger.log(`Created payment record for order ${orderId}`);

    await this.sendAzamPesaSTKPush(payment);

    return payment;
  }

  async retryPayment(
    orderId: string,
    dto: InitiatePaymentDto,
  ): Promise<PaymentDocument> {
    this.logger.warn(`Retrying payment for order ${orderId}`);

    return this.initiatePaymentRecord(orderId, dto);
  }

  async findPayments(
    filters: { orderId?: string; status?: PaymentStatus },
    limit: number = 20,
    page: number = 1,
  ): Promise<{
    results: PaymentResponseDto[];
    totalItems: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
  }> {
    const query: any = {};

    if (filters.orderId) query.order = filters.orderId;

    if (filters.status) query.status = filters.status;

    const [totalItems, payments] = await Promise.all([
      this.paymentModel.countDocuments(query),
      this.paymentModel
        .find(query)
        .populate('order', 'user total status createdAt')
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      results: payments.map(PaymentResponseDto.from),
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    };
  }

  async updatePaymentStatus(
    transactionId: string,
    status: PaymentStatus,
    options?: {
      paidAt?: Date;
      message?: string;
    },
  ): Promise<PaymentResponseDto> {
    const payment = await this.paymentModel.findOne({ transactionId });
    if (!payment) throw new NotFoundException('Payment record not found');

    payment.status = status;
    if (options?.paidAt) payment.paidAt = options.paidAt;
    if (options?.message) payment.message = options.message;

    await payment.save();

    this.logger.log(`Updated payment ${payment._id} status to ${status}`);

    return PaymentResponseDto.from(payment);
  }

  async getLatestByOrder(orderId: string): Promise<PaymentDocument | null> {
    return this.paymentModel
      .findOne({ order: orderId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async countFailedPayments(orderId: string): Promise<number> {
    return this.paymentModel.countDocuments({
      order: orderId,
      status: PaymentStatus.FAILED,
    });
  }

  private async sendAzamPesaSTKPush(payment: PaymentDocument) {
    try {
      const payload = {
        accountNumber: payment.phoneNumber,
        amount: 1000, // ← You must fetch order total
        currency: 'TZS',
        externalReferenceId: payment._id, // Or orderId
        provider: payment.selectedNetwork,
        description: 'Order Payment',
        // TODO: Additional fields depending on AzamPesa docs
      };

      // Example using fetch:
      const res = await fetch(
        'https://sandbox.azampay.co.tz/api/payments/stk',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer YOUR_ACCESS_TOKEN`,
          },
          body: JSON.stringify(payload),
        },
      );

      const response = await res.json();

      if (!res.ok) throw new Error(response.message || 'AzamPesa error');

      // Update payment with sessionId or transactionId if returned
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        sessionId: response.sessionId, // if returned
        message: 'AzamPesa STK push sent',
      });

      this.logger.log(`AzamPesa STK push sent successfully`);
    } catch (err) {
      this.logger.error('AzamPesa API call failed', err);
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.FAILED,
        message: 'AzamPesa API call failed',
      });
    }
  }

  async handleAzamPesaWebhook(dto: AzamPesaWebhookDto) {
    const payment = await this.paymentModel.findOne({
      transactionId: dto.transactionId,
    });
    if (!payment) throw new NotFoundException('Payment not found');

    payment.status = this.mapAzamStatusToSystemStatus(dto.status);
    payment.paidAt = new Date(dto.paidAt);
    payment.message = dto.message;
    await payment.save();

    this.logger.log(
      `Webhook updated payment ${payment._id} with status: ${dto.status}`,
    );

    await this.ordersService.updatePaymentStatus(payment.order.toString(), {
      status: payment.status,
      transactionId: dto.transactionId,
      paidAt: new Date(dto.paidAt),
      message: dto.message || 'Updated via AzamPesa webhook',
    });

    this.logger.log(
      `Order ${payment.order} paymentStatus updated via webhook to ${dto.status}`,
    );
  }

  private mapAzamStatusToSystemStatus(
    status: AzamPesaPaymentStatus,
  ): PaymentStatus {
    switch (status) {
      case AzamPesaPaymentStatus.SUCCESS:
        return PaymentStatus.PAID;
      case AzamPesaPaymentStatus.FAILED:
        return PaymentStatus.FAILED;
      case AzamPesaPaymentStatus.CANCELLED:
        return PaymentStatus.CANCELLED;
      case AzamPesaPaymentStatus.PENDING:
      default:
        return PaymentStatus.PENDING;
    }
  }
}
