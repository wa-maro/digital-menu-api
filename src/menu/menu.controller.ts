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
import { Roles } from 'src/common/decorators/roles.decorator';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { PermissionsGuard } from 'src/common/guards/permissions.guard';
import { Permissions } from 'src/common/decorators/permissions.decorator';

@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories
  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('category:create')
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return await this.menuService.createCategory(dto);
  }

  @Get('categories')
  async getCategories() {
    return await this.menuService.getCategories();
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('category:update')
  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return await this.menuService.updateCategory(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('category:delete')
  @Delete('categories/:id')
  async delete(@Param('id') id: string) {
    return await this.menuService.deleteCategory(id);
  }

  // Items
  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:create')
  @Post('items')
  async createItem(@Body() dto: CreateItemDto) {
    return await this.menuService.createItem(dto);
  }

  @Get('items')
  async getItems() {
    return await this.menuService.getItems();
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:update')
  @Put('items/:id')
  async updateItem(
    @Param('id') id: string,
    @Body() dto: Partial<CreateItemDto>,
  ) {
    return await this.menuService.updateItem(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:delete')
  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    return await this.menuService.deleteItem(id);
  }
}
