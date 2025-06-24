import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Payment, PaymentDocument } from './schema/payment.schema';
import { Model } from 'mongoose';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { PaymentStatus } from 'src/orders/schemas/order.schema';
import { PaymentResponseDto } from './dto/payment-response.dto';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
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
    limit = 20,
    page = 1,
  ): Promise<{
    payments: PaymentResponseDto[];
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
      payments: payments.map(PaymentResponseDto.from),
      totalItems,
      totalPages,
      currentPage: page,
      pageSize: limit,
    };
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
      // TODO: Call AzamPesa API here to initiate STK Push or Lipa Namba code
      // 1. Call AzamPesa HTTP endpoint here using HttpService or fetch
      // 2. Include payment.selectedNetwork, payment.phoneNumber, etc.
      // 3. Update payment status based on success/failure
    } catch (err) {
      this.logger.error('AzamPesa API call failed', err);
      await this.paymentModel.findByIdAndUpdate(payment._id, {
        status: PaymentStatus.FAILED,
        message: 'AzamPesa API call failed',
      });
    }
  }
}
