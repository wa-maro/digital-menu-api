import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApproveCancelDto } from './dto/approve-cancel.dto';
import { ManualPaymentConfirmationDto } from 'src/payments/dto/manual-payment-confirmation.dto';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { PaymentStatusQueryDto } from 'src/payments/dto/payment-status-query.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get('all')
  async getAllOrders() {
    return await this.ordersService.getAllOrders();
  }

  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return await this.ordersService.getOrderByIdForAdmin(id);
  }

  @Put(':id/update-status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.ordersService.updateOrderStatus(id, dto.status);
  }

  @Post(':id/process-cancellation')
  async processCancellation(
    @Param('id') id: string,
    @Body() dto: ApproveCancelDto,
  ) {
    return await this.ordersService.approveOrRejectCancel(id, dto.status);
  }

  @Post(':orderId/confirm-manual-payment')
  async confirmManualPayment(
    @Param('orderId') orderId: string,
    @Body() dto: ManualPaymentConfirmationDto,
  ) {
    return await this.ordersService.confirmManualPayment(orderId, dto);
  }

  @Post('status/query')
  async queryPaymentStatus(
    @Body() dto: PaymentStatusQueryDto,
    @Req() req: CustomRequest,
  ) {
    return await this.ordersService.queryPaymentStatus(dto);
  }
}
