import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PlaceOrderDto } from './dto/place-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';
import { PlaceFromCartDto } from './dto/place-from-cart.dto';
import { ReorderDto } from './dto/reorder.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { OrderStatus } from './schemas/order.schema';

@UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:place')
  @Post()
  async placeOrder(@Body() dto: PlaceOrderDto, @Req() req: CustomRequest) {
    return await this.ordersService.placeOrder(req.user['userId'], dto);
  }

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:place-from-cart')
  @Post('place-from-cart')
  async placeOrderFromCart(
    @Body() dto: PlaceFromCartDto,
    @Req() req: CustomRequest,
  ) {
    return await this.ordersService.placeOrderFromCart(req.user['userId'], dto);
  }

  @Roles('admin', 'manager', 'customer')
  @Post(':orderId/reorder-from-past')
  async reorderFromPast(
    @Param('orderId') orderId: string,
    @Body() dto: ReorderDto,
    @Req() req: CustomRequest,
  ) {
    return await this.ordersService.reorderFromPast(
      req.user['userId'],
      orderId,
      dto,
    );
  }

  @Roles('customer')
  @Permissions('order:read:own')
  @Get()
  async getMyOrders(@Req() req: CustomRequest) {
    return await this.ordersService.getUserOrders(req.user['userId']);
  }

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:read')
  @Get(':id')
  async getOrder(@Param('id') id: string, @Req() req: CustomRequest) {
    return await this.ordersService.getOrderById(id, req.user['userId']);
  }

  @Roles('manager', 'admin')
  @Permissions('order:update:status')
  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return await this.ordersService.updateOrderStatus(id, dto);
  }

  @Get('all')
  @Roles('manager', 'admin')
  @Permissions('order:read:all')
  async getAllOrders() {
    return await this.ordersService.getAllOrders();
  }

  @Roles('customer')
  @Post(':id/request-to-cancel')
  async requestCancel(@Param('id') id: string, @Req() req: CustomRequest) {
    return await this.ordersService.requestCancel(id, req.user['userId']);
  }

  @Roles('manager', 'admin')
  @Post(':id/approve-to-cancel')
  async approveCancel(@Param('id') id: string, @Body() status: OrderStatus) {
    return await this.ordersService.approveOrRejectCancel(id, status);
  }
}
