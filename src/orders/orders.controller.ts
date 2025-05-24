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

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles('admin', 'manager', 'customer')
  @Post()
  placeOrder(@Body() dto: PlaceOrderDto, @Req() req: CustomRequest) {
    return this.ordersService.placeOrder(req.user['userId'], dto);
  }

  @Roles('customer')
  @Get()
  getMyOrders(@Req() req: CustomRequest) {
    return this.ordersService.getUserOrders(req.user['userId']);
  }

  @Roles('admin', 'manager', 'customer')
  @Get(':id')
  getOrder(@Param('id') id: string, @Req() req: CustomRequest) {
    return this.ordersService.getOrderById(id, req.user['userId']);
  }

  @Roles('manager', 'admin')
  @Put(':id/status')
  updateOrderStatus(@Param('id') id: string, @Body() dto, @Req() req: Request) {
    return this.ordersService.updateStatus(id, dto.status);
  }

  @Get('all')
  @Roles('manager', 'admin')
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }
}
