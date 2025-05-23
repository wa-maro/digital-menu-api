import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { AuthGuard } from '@nestjs/passport';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories
  @UseGuards(AuthGuard('jwt'))
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  getCategories() {
    return this.menuService.getCategories();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('categories/:id')
  delete(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // Items
  @UseGuards(AuthGuard('jwt'))
  @Post('items')
  createItem(@Body() dto: CreateItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  getItems() {
    return this.menuService.getItems();
  }

  @UseGuards(AuthGuard('jwt'))
  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: Partial<CreateItemDto>) {
    return this.menuService.updateItem(id, dto);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }
}
