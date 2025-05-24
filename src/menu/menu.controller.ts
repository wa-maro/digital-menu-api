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
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Get('categories')
  getCategories() {
    return this.menuService.getCategories();
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('category:update')
  @Put('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<CreateCategoryDto>,
  ) {
    return this.menuService.updateCategory(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('category:delete')
  @Delete('categories/:id')
  delete(@Param('id') id: string) {
    return this.menuService.deleteCategory(id);
  }

  // Items
  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:create')
  @Post('items')
  createItem(@Body() dto: CreateItemDto) {
    return this.menuService.createItem(dto);
  }

  @Get('items')
  getItems() {
    return this.menuService.getItems();
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:update')
  @Put('items/:id')
  updateItem(@Param('id') id: string, @Body() dto: Partial<CreateItemDto>) {
    return this.menuService.updateItem(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RoleGuard, PermissionsGuard)
  @Roles('admin', 'manager')
  @Permissions('item:delete')
  @Delete('items/:id')
  deleteItem(@Param('id') id: string) {
    return this.menuService.deleteItem(id);
  }
}
