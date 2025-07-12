import {
  Body,
  Controller,
  Delete,
  Param,
  Put,
  Post,
  UseGuards,
  Get,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { Roles } from 'src/common/decorators/roles.decorator';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/menu')
export class AdminMenuController {
  constructor(private readonly menuService: MenuService) {}

  // Categories
  @Post('categories')
  async createCategory(@Body() dto: CreateCategoryDto) {
    return await this.menuService.createCategory(dto);
  }

  @Put('categories/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return await this.menuService.updateCategory(id, dto);
  }

  @Get('categories/:id')
  async getCategory(@Param('id') id: string) {
    return await this.menuService.getCategory(id);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return await this.menuService.deleteCategory(id);
  }

  // Items
  @Post('items')
  async createItem(@Body() dto: CreateItemDto) {
    return await this.menuService.createItem(dto);
  }

  @Put('items/:id')
  async updateItem(@Param('id') id: string, @Body() dto: UpdateItemDto) {
    return await this.menuService.updateItem(id, dto);
  }

  @Delete('items/:id')
  async deleteItem(@Param('id') id: string) {
    return await this.menuService.deleteItem(id);
  }
}
