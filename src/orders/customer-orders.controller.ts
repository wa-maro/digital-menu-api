import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { PlaceOrderDto } from './dto/place-order.dto';
import { PlaceFromCartDto } from './dto/place-from-cart.dto';
import { ReorderDto } from './dto/reorder.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/orders')
export class CustomerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // @Permissions('order:place')
  @Post()
  async placeOrder(@Body() dto: PlaceOrderDto, @Req() req: CustomRequest) {
    return await this.ordersService.placeOrder(req.user['userId'], dto);
  }

  // @Permissions('order:place-from-cart')
  @Post('place-from-cart')
  async placeOrderFromCart(
    @Body() dto: PlaceFromCartDto,
    @Req() req: CustomRequest,
  ) {
    return await this.ordersService.placeOrderFromCart(req.user['userId'], dto);
  }

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

  // @Permissions('order:read:own')
  @Get()
  async getMyOrders(@Req() req: CustomRequest) {
    return await this.ordersService.getUserOrders(req.user['userId']);
  }

  @Get(':id')
  async getOrder(@Param('id') id: string, @Req() req: CustomRequest) {
    return await this.ordersService.getOrderById(id, req.user['userId']);
  }

  @Post(':id/request-to-cancel')
  async requestCancel(@Param('id') id: string, @Req() req: CustomRequest) {
    return await this.ordersService.requestCancel(id, req.user['userId']);
  }
}
