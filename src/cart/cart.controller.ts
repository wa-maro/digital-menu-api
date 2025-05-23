import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin', 'manager', 'customer')
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
