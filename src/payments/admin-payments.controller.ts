import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentsService } from './payments.service';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getPayments() {
    return await this.paymentsService.getPayments();
  }

  @Get(':id')
  async getPaymentById(@Param('id') id: string) {
    return await this.paymentsService.getPaymentById(id);
  }

  @Post('confirm-manual-payment')
  async confirmManualPayment(@Body('orderId') orderId: string) {
    return await this.paymentsService.confirmCashPayment(orderId);
  }
}
