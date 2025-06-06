import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  Post,
  Get,
  UseGuards,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Public GET endpoints
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

  // Protected Category endpoints
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return await this.menuService.createCategory(dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.menuService.updateCategory(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return await this.menuService.deleteCategory(id);
  }

  // Protected Item endpoints
  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Post('items')
  async createItem(@Body() dto: CreateItemDto) {
    return await this.menuService.createItem(dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return await this.menuService.updateItem(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard)
  @Roles('manager', 'admin')
  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    return await this.menuService.deleteItem(id);
  }
}
