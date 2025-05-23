import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CustomRequest } from 'src/interfaces/custom-request.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCategoryDto } from 'src/menu/dto/update-category.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Req() req: CustomRequest) {
    return this.cartService.getUserCart(req.user['userId']);
  }

  @Post()
  addItem(@Body() dto: AddToCartDto, @Req() req: CustomRequest) {
    return this.cartService.addItem(req.user['userId'], dto);
  }

  @Patch(':itemId')
  updateItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: CustomRequest,
  ) {
    return this.cartService.updateItemQuantity(req.user['userId'], itemId, dto);
  }

  @Delete('itemId')
  removeItem(@Param('itemId') itemId: string, @Req() req: CustomRequest) {
    return this.cartService.removeItem(req.user['userId'], itemId);
  }

  @Delete()
  clearCart(@Req() req: CustomRequest) {
    return this.cartService.clearCart(req.user['userId']);
  }
}
