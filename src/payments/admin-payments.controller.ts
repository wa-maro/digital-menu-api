import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { ManualPaymentConfirmationDto } from './dto/manual-payment-confirmation.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/payments')
export class AdminPaymentController {
  constructor(private readonly paymentService: PaymentsService) {}

  @Post(':orderId/confirm-manual-payment')
  async confirmManualPayment(
    @Param('orderId') orderId: string,
    @Body() dto: ManualPaymentConfirmationDto,
  ) {
    return await this.paymentService.confirmManualPayment(orderId, dto);
  }
}
