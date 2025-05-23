import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Category, CategoryDocument } from './schemas/category.schema';
import { MenuItem, MenuItemDocument } from './schemas/item.schema';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateItemDto } from './dto/create-item.dto';
import { Model } from 'mongoose';

@Injectable()
export class MenuService {
  constructor(
    @InjectModel(Category.name) private categoryModel: Model<CategoryDocument>,
    @InjectModel(MenuItem.name) private itemModel: Model<MenuItemDocument>,
  ) {}

  // Category CRUD Operations
  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.categoryModel.findOne({ name: dto.name });
    if (existing)
      throw new BadRequestException(
        `Category with name "${dto.name}" already exists.`,
      );

    return await this.categoryModel.create(dto);
  }

  async getCategories() {
    return await this.categoryModel.find().exec();
  }

  async updateCategory(id: string, dto: Partial<CreateCategoryDto>) {
    const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!category)
      throw new NotFoundException(`Category with ID "${id}" not found.`);

    return category;
  }

  async deleteCategory(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);
    if (!category)
      throw new NotFoundException(`Category with ID "${id}" not found.`);

    return category;
  }

  // Item CRUD Operations
  async createItem(dto: CreateItemDto) {
    const existing = await this.itemModel.findOne({ name: dto.name });
    if (existing)
      throw new BadRequestException(
        `Item with name "${dto.name}" already exists.`,
      );

    return await this.itemModel.create(dto);
  }

  async getItems() {
    return await this.itemModel.find().populate('category').exec();
  }

  async updateItem(id: string, dto: Partial<CreateItemDto>) {
    const item = await this.itemModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found.`);

    return item;
  }

  async deleteItem(id: string) {
    const item = await this.itemModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found.`);

    return item;
  }
}
