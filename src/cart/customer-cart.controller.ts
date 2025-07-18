import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from 'src/orders/orders.service';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('customer')
@Controller('customer/cart')
export class CustomerCartController {
  constructor(
    private readonly cartService: CartService,
    private readonly ordersService: OrdersService,
  ) {}

  @Get()
  async getUserCart(@Req() req: CustomRequest) {
    return await this.cartService.getUserCart(req.user.userId);
  }

  @Post()
  async addItemToUserCart(
    @Body() dto: AddToCartDto,
    @Req() req: CustomRequest,
  ) {
    return await this.cartService.addItemToCart(req.user.userId, dto);
  }

  @Patch('update-quantity')
  async updateItemQuantity(
    @Body() dto: UpdateCartItemDto,
    @Req() req: CustomRequest,
  ) {
    return await this.cartService.updateItemQuantity(
      req.user.userId,
      dto.itemId,
      dto.quantity,
    );
  }

  @Delete('remove-item/:itemId')
  async removeItem(@Param('itemId') itemId: string, @Req() req: CustomRequest) {
    return await this.cartService.removeItemFromCart(req.user.userId, itemId);
  }

  @Delete('clear')
  async clearUserCart(@Req() req: CustomRequest) {
    return await this.cartService.clearCartItems(req.user.userId);
  }

  @Get('from-order/:orderId')
  async loadCartFromOrder(
    @Req() req: CustomRequest,
    @Param('orderId') orderId: string,
    @Query('merge') merge: 'false' | 'true' = 'false',
  ) {
    const userId = req.user.userId;
    const order = await this.ordersService.getOrderById(orderId, userId);

    if (!order || order.user.toString() !== userId)
      throw new ForbiddenException('Invalid or unauthorized order access');

    return await this.cartService.createCartFromOrder(order, merge === 'true');
  }
}
