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
    const limit = Math.min(100, filters.limit || 50); // limit max to 100
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
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid User ID');

    if (!isValidObjectId(dto.category))
      throw new BadRequestException('Invalid Category ID');

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
      displayName: dto.displayName,
      url: uploadedFile.url,
      category: new Types.ObjectId(dto.category),
      filename: uploadedFile.filename,
      uploadedBy: new Types.ObjectId(userId),
    });
    if (!media) throw new BadRequestException('Media not created');

    return await media.save();
  }

  async updateMediaFile(
    id: string,
    userId: string,
    dto: UpdateMediaDto,
    file?: Express.Multer.File,
  ) {
    const { displayName, category } = dto;

    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid media ID: ${id}`);

    if (category && !isValidObjectId(category))
      throw new BadRequestException(`Invalid category ID: ${dto.category}`);

    const media = await this.mediaModel.findById(id);
    if (!media) throw new NotFoundException('Media not found');

    if (file) {
      const { filename, url } = await this.uploadMediaFile(file);

      await this.deleteOldFile(media.filename);

      media.filename = filename;
      media.url = url;
    }

    if (displayName) media.displayName = displayName;
    if (category) media.category = new Types.ObjectId(category);

    media.uploadedBy = new Types.ObjectId(userId);

    return await media.save();
  }

  async deleteMediaFile(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid media ID: ${id}`);

    const media = await this.findOneById(id);

    await this.deleteOldFile(media.filename);

    await this.mediaModel.deleteOne({ _id: media._id });

    return { message: 'Media deleted successfully', id };
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

  private async deleteOldFile(filename: string) {
    const oldFilePath = path.join(process.cwd(), 'uploads/media', filename);

    try {
      await fs.unlink(oldFilePath);
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // Ignore "file not found" errors
        console.error(`Failed to delete file ${filename}:`, err.message);
      }
    }
  }
}
