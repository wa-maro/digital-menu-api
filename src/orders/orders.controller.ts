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

@UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:place')
  @Post()
  placeOrder(@Body() dto: PlaceOrderDto, @Req() req: CustomRequest) {
    return this.ordersService.placeOrder(req.user['userId'], dto);
  }

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:place-from-cart')
  @Post('place-from-cart')
  placeOrderFromCart(@Body() dto: PlaceFromCartDto, @Req() req: CustomRequest) {
    return this.ordersService.placeOrderFromCart(req.user['userId'], dto);
  }

  @Roles('admin', 'manager', 'customer')
  @Post(':orderId/reorder-from-past')
  reorderFromPast(
    @Param('orderId') orderId: string,
    @Body() dto: ReorderDto,
    @Req() req: CustomRequest,
  ) {
    return this.ordersService.reorderFromPast(req.user['userId'], orderId, dto);
  }

  @Roles('customer')
  @Permissions('order:read:own')
  @Get()
  getMyOrders(@Req() req: CustomRequest) {
    return this.ordersService.getUserOrders(req.user['userId']);
  }

  @Roles('admin', 'manager', 'customer')
  @Permissions('order:read')
  @Get(':id')
  getOrder(@Param('id') id: string, @Req() req: CustomRequest) {
    return this.ordersService.getOrderById(id, req.user['userId']);
  }

  @Roles('manager', 'admin')
  @Permissions('order:update:status')
  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto, @Req() req: Request) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Get('all')
  @Roles('manager', 'admin')
  @Permissions('order:read:all')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
