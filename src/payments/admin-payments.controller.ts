import {
  Body,
  Controller,
  Get,
  Logger,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from 'src/orders/schemas/order.schema';
import { UpdatePaymentStatusDto } from 'src/orders/dto/update-payment-status.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/payments')
export class AdminPaymentController {
  private readonly logger = new Logger(AdminPaymentController.name);

  constructor(private readonly paymentService: PaymentsService) {}

  @Get()
  async listPayments(
    @Query('orderId') orderId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('limit') limit = 20,
    @Query('page') page = 1,
  ) {
    const filters = { orderId, status };
    return this.paymentService.findPayments(filters, +limit, +page);
  }

  @Patch('update-status/:transactionId')
  async updatePaymentStatus(
    @Param('transactionId') transactionId: string,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    const { status, paidAt, message } = dto;

    const updatedPayment = await this.paymentService.updatePaymentStatus(
      transactionId,
      status,
      {
        paidAt: paidAt ? new Date(paidAt) : undefined,
        message,
      },
    );

    this.logger.log(
      `Payment ${transactionId} status updated to ${status.toUpperCase()} by admin`,
    );

    console.log(updatedPayment._id);

    return PaymentResponseDto.from(updatedPayment);
  }
}
