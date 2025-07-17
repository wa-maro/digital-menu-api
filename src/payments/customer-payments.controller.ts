import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PaymentsService } from './payments.service';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/payments')
export class CustomerPaymentController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  async getPayments(@Req() req: CustomRequest) {
    const userId = req.user.userId;
    return await this.paymentsService.getUserPayments(userId);
  }

  @Get(':id')
  async getPaymentById(@Param('id') id: string, @Req() req: CustomRequest) {
    const userId = req.user.userId;
    return await this.paymentsService.getUserPaymentById(id, userId);
  }
}
