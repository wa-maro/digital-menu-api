import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from './schemas/media.schema';
import mongoose, { isValidObjectId, Model, Types } from 'mongoose';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MenuService } from 'src/menu/menu.service';
import { escapeRegex } from 'src/common/helpers/regex.helper';
import { FetchMediaQueryDto } from './dto/fetch-media.dto';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UpdateMediaDto } from './dto/update-media.dto';

interface MediaFilterQuery {
  category?: string;
  name?: { $regex: string; $options: string };
}

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    private readonly menuService: MenuService,
  ) {}

  async findAll(
    filters: FetchMediaQueryDto,
  ): Promise<{ items: Media[]; total: number }> {
    const query: MediaFilterQuery = {};
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, filters.limit || 10); // limit max to 100
    const skip = (page - 1) * limit;

    // Resolve category by ID or name
    if (filters.category) {
      const categoryDoc = mongoose.Types.ObjectId.isValid(filters.category)
        ? await this.menuService.getCategory(filters.category)
        : await this.menuService.getCategoryByName(filters.category);

      if (!categoryDoc) return { items: [], total: 0 }; // No matching category
      query.category = String(categoryDoc._id);
    }

    // Filter by name (partial, case-insensitive)
    if (filters.name) {
      const escapedName = escapeRegex(filters.name);
      query.name = { $regex: escapedName, $options: 'i' };
    }

    const [items, total] = await Promise.all([
      this.mediaModel
        .find(query)
        .populate('category')
        .populate({
          path: 'linkedMenuItemIds',
          select: 'name price',
        })
        .populate({ path: 'uploadedBy', select: 'fullName email' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.mediaModel.countDocuments(query),
    ]);

    return { items, total };
  }

  async findOneById(id: string) {
    if (!isValidObjectId(id)) throw new BadRequestException('Invalid media ID');

    const media = await this.mediaModel
      .findById(id)
      .populate('category')
      .populate({
        path: 'linkedMenuItemIds',
        select: 'name price imageURL',
      })
      .populate({ path: 'uploadedBy', select: 'fullName email' })
      .lean()
      .exec();
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found.`);
    }

    return media;
  }

  async createMediaFile(
    file: Express.Multer.File,
    dto: UploadMediaDto,
    userId: string,
  ) {
    const existing = await this.mediaModel.findOne({
      $or: [
        { displayName: { $regex: `^${dto.displayName}$`, $options: 'i' } },
        { filename: { $regex: `^${file.filename}$`, $options: 'i' } },
      ],
    });
    if (existing)
      throw new ConflictException(
        'A media item with the same filename or display name already exists.',
      );

    const uploadedFile = await this.uploadMediaFile(file);

    const media = new this.mediaModel({
      ...dto,
      url: uploadedFile.url,
      filename: uploadedFile.filename,
      uploadedBy: userId,
    });
    if (!media) throw new BadRequestException('Media not created');

    return await media.save();
  }

  private async uploadMediaFile(
    file: Express.Multer.File,
  ): Promise<{ url: string; filename: string }> {
    if (!file) throw new BadRequestException('No file uploaded');

    const url = `/uploads/media/${file.filename}`;

    return {
      url,
      filename: file.filename,
    };
  }
}
