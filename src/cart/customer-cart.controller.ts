import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from 'src/orders/orders.service';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/cart')
export class CustomerCartController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async getCart(@Req() req: CustomRequest) {
    return await this.cartService.getUserCart(req.user['userId']);
  }

  @Post()
  async addItem(@Body() dto: AddToCartDto, @Req() req: CustomRequest) {
    const userId = req.user['userId'];

    return await this.cartService.addItem(userId, dto);
  }

  @Patch(':itemId')
  async updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: CustomRequest,
  ) {
    return await this.cartService.updateItemQuantity(
      req.user['userId'],
      itemId,
      dto,
    );
  }

  @Delete(':itemId')
  async removeItem(@Param('itemId') itemId: string, @Req() req: CustomRequest) {
    return await this.cartService.removeItem(req.user['userId'], itemId);
  }

  @Delete()
  async clearCart(@Req() req: CustomRequest) {
    return await this.cartService.clearCart(req.user['userId']);
  }

  @Get('from-order/:orderId')
  async loadCartFromOrder(
    @Req() req: CustomRequest,
    @Param('orderId') orderId: string,
    @Query('merge') merge: 'false' | 'true' = 'false',
  ) {
    const userId = req.user['userId'];
    const order = await this.ordersService.getOrderById(orderId, userId);

    if (!order || order.user.toString() !== userId)
      throw new Error('Invalid or unauthorized order access');

    return await this.cartService.createCartFromOrder(order, merge === 'true');
  }
}
