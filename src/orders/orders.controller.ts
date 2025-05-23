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
import { PlaceOrderDto } from './dto/place-order.dto';
import { AuthGuard } from '@nestjs/passport';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

@UseGuards(AuthGuard('jwt'))
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  placeOrder(@Body() dto: PlaceOrderDto, @Req() req: CustomRequest) {
    return this.ordersService.placeOrder(req.user['userId'], dto);
  }

  @Get()
  getMyOrders(@Req() req: CustomRequest) {
    return this.ordersService.getUserOrders(req.user['userId']);
  }

  @Get(':id')
  getOrder(@Param('id') id: string, @Req() req: CustomRequest) {
    return this.ordersService.getOrderById(id, req.user['userId']);
  }
}
