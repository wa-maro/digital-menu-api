import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin', 'manager')
@Controller('admin/cart')
export class AdminCartController {
  constructor(private readonly cartService: CartService) {}

  @Get('user/:userId')
  async getUserCart(@Param('userId') userId: string) {
    return await this.cartService.getUserCart(userId);
  }

  @Delete('user/:userId')
  async clearUserCart(@Param('userId') userId: string) {
    return await this.cartService.clearCart(userId);
  }

  @Post('user/:userId/items')
  async addItemToUserCart(
    @Param('userId') userId: string,
    @Body() dto: AddToCartDto,
  ) {
    return await this.cartService.addItem(userId, dto);
  }

  @Patch('user/:userId/items/:itemId')
  async updateUserCartItem(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return await this.cartService.updateItemQuantity(userId, itemId, dto);
  }

  @Delete('user/:userId/items/:itemId')
  async removeItemFromUserCart(
    @Param('userId') userId: string,
    @Param('itemId') itemId: string,
  ) {
    return await this.cartService.removeItem(userId, itemId);
  }
}
