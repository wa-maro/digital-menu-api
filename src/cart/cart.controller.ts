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
@Roles('admin', 'manager', 'customer')
@Controller('cart')
export class CartController {
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
    return await this.cartService.addItem(req.user['userId'], dto);
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

  @Delete('itemId')
  async removeItem(@Param('itemId') itemId: string, @Req() req: CustomRequest) {
    return await this.cartService.removeItem(req.user['userId'], itemId);
  }

  @Delete()
  async clearCart(@Req() req: CustomRequest) {
    return await this.cartService.clearCart(req.user['userId']);
  }

  @Post('reorder/:orderId')
  async reorderToCart(
    @Param('orderId') orderId: string,
    @Query('merge') merge: 'false' | 'true' = 'false',
    @Req() req: CustomRequest,
  ) {
    const order = await this.ordersService.getOrderById(
      orderId,
      req.user['userId'],
    );
    return await this.cartService.createCartFromCart(order, merge === 'true');
  }
}
