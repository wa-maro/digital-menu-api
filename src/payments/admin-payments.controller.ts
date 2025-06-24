import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { PaymentStatus } from 'src/orders/schemas/order.schema';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/payments')
export class AdminPaymentController {
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
}
