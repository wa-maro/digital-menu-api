import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  getCategories() {
    return this.menuService.getCategories();
  }

  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  delete(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // Items
  @Post('items')
  createItem(@Body() dto: CreateItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  getItems() {
    return this.menuService.getItems();
  }

  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: Partial<CreateItemDto>) {
    return this.menuService.updateItem(id, dto);
  }

  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }
}
