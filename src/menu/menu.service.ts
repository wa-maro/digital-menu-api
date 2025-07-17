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
import { isValidObjectId, Model, Types } from 'mongoose';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { UpdateItemDto } from './dto/update-item.dto';
import { escapeRegex } from 'src/common/helpers/regex.helper';

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

    const category = new this.categoryModel(dto);
    await category.save();
  }

  async getCategories() {
    return await this.categoryModel.find().lean().exec();
  }

  async getCategory(id: string): Promise<CategoryDocument> {
    if (!isValidObjectId(id)) {
      throw new BadRequestException(`Invalid category ID: ${id}`);
    }

    const category = await this.categoryModel.findById(id);
    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found.`);
    }

    return category;
  }

  async getCategoryByName(name: string): Promise<CategoryDocument | null> {
    const escapedName = escapeRegex(name); // avoid regex injection if needed
    return this.categoryModel.findOne({
      name: { $regex: escapedName, $options: 'i' }, // partial match, case-insensitive
    });
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid category ID: ${id}`);

    const category = await this.categoryModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
    if (!category)
      throw new NotFoundException(`Category with ID "${id}" not found.`);

    return category;
  }

  async deleteCategory(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid category ID: ${id}`);

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

    const { category, name, price, available, description, imageURL } = dto;

    const item = new this.itemModel({
      name,
      price,
      description,
      available,
      imageURL,
      category: new Types.ObjectId(category),
    });
    await item.save();
  }

  async getItems() {
    return await this.itemModel.find().populate('category').lean().exec();
  }

  async getItem(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid item ID: ${id}`);

    const item = await this.itemModel
      .findById(id)
      .populate('category')
      .lean()
      .exec();
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found.`);

    return item;
  }

  async updateItem(id: string, dto: UpdateItemDto) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid item ID: ${id}`);

    const item = await this.itemModel.findByIdAndUpdate(id, dto, { new: true });
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found.`);

    return item;
  }

  async deleteItem(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid item ID: ${id}`);

    const item = await this.itemModel.findByIdAndDelete(id);
    if (!item) throw new NotFoundException(`Item with ID "${id}" not found.`);

    return item;
  }
}
