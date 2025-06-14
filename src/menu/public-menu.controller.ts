import { Controller, Get, Param } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class PublicMenuController {
  constructor(private readonly menuService: MenuService) {}

  @Get('categories')
  async getCategories() {
    return await this.menuService.getCategories();
  }

  @Get('items')
  async getItems() {
    return await this.menuService.getItems();
  }

  @Get('items/:id')
  async getItem(@Param('id') id: string) {
    return await this.menuService.getItem(id);
  }
}
