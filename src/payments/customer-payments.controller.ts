import {
  BadRequestException,
  Body,
  Controller,
  NotFoundException,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentStatus } from 'src/orders/schemas/order.schema';
import { InitiatePaymentDto } from './dto/initiate-payment.dto';
import { OrdersService } from 'src/orders/orders.service';
import { PaymentsService } from './payments.service';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/payments')
export class CustomerPaymentController {
  constructor(
    private readonly paymentService: PaymentsService,
    private readonly ordersService: OrdersService,
  ) {}

  @Post('initiate/:orderId')
  async initiatePayment(
    @Param('orderId') orderId: string,
    @Body() dto: InitiatePaymentDto,
    @Req() req: CustomRequest,
  ) {
    const { phoneNumber, selectedNetwork, paymentMethod, message, sessionId } =
      dto;

    const order = await this.ordersService.getOrderById(
      orderId,
      req.user['userId'],
    );

    if (!order) throw new NotFoundException('Order not found');

    if (order.paymentStatus === PaymentStatus.PENDING)
      throw new BadRequestException(
        'A payment for this order is already in progress',
      );

    if (order.paymentStatus === PaymentStatus.PAID)
      throw new BadRequestException('This order has already been paid');

    const finalSessionId = sessionId || `mock-session-${Date.now()}`;
    const finalMessage = message || 'Payment initiated';

    const payment = await this.paymentService.initiatePaymentRecord(orderId, {
      paymentMethod: paymentMethod,
      selectedNetwork: selectedNetwork,
      phoneNumber,
      sessionId: finalSessionId,
      message: finalMessage,
    });

    await this.ordersService.updatePaymentStatus(orderId, {
      status: PaymentStatus.PENDING,
      message: finalMessage,
    });

    return PaymentResponseDto.from(payment);
  }

  @Post('retry/:orderId')
  async retryPayment(
    @Param('orderId') orderId: string,
    @Req() req: CustomRequest,
  ) {
    const order = await this.ordersService.getOrderById(
      orderId,
      req.user['userId'],
    );
    if (!order) throw new NotFoundException('Order not found');

    const latestPayment = await this.paymentService.getLatestByOrder(orderId);

    if (!latestPayment || latestPayment.status !== PaymentStatus.FAILED)
      throw new BadRequestException('Retry not allowed at this stage');

    const MAX_RETRIES = 3;

    const failedAttempts =
      await this.paymentService.countFailedPayments(orderId);
    if (failedAttempts >= MAX_RETRIES)
      throw new BadRequestException(
        `Retry limit reached (${MAX_RETRIES} attempts). Please contact support.`,
      );

    const dto: InitiatePaymentDto = {
      phoneNumber: latestPayment.phoneNumber,
      selectedNetwork: latestPayment.selectedNetwork,
      paymentMethod: latestPayment.paymentMethod,
      sessionId: `retry-${Date.now()}`,
      message: 'Customer retried payment',
    };

    const payment = await this.paymentService.initiatePaymentRecord(
      orderId,
      dto,
    );

    await this.ordersService.updatePaymentStatus(orderId, {
      status: PaymentStatus.PENDING,
      message: dto.message,
    });

    return PaymentResponseDto.from(payment);
  }
}
