import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UpdateStatusDto } from './dto/update-status.dto';
import { ApproveCancelDto } from './dto/approve-cancel.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // @Permissions('order:read:all')
  @Get('all')
  async getAllOrders() {
    return await this.ordersService.getAllOrders();
  }

  // @Permissions('order:read')
  @Get(':id')
  async getOrder(@Param('id') id: string) {
    return await this.ordersService.getOrderByIdForAdmin(id);
  }

  // @Permissions('order:update:status')
  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.ordersService.updateOrderStatus(id, dto);
  }

  @Post(':id/approve-to-cancel')
  async approveCancel(@Param('id') id: string, @Body() dto: ApproveCancelDto) {
    return await this.ordersService.approveOrRejectCancel(id, dto.status);
  }
}
