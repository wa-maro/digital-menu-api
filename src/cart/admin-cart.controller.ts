import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { CartService } from './cart.service';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('admin', 'manager')
@Controller('admin/carts')
export class AdminCartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getCarts() {
    return await this.cartService.getAllCarts();
  }

  @Get(':id')
  async getCart(@Param() id: string) {
    return await this.cartService.getCartById(id);
  }
}
