import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from './schemas/media.schema';
import mongoose, { Model } from 'mongoose';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MenuService } from 'src/menu/menu.service';
import { escapeRegex } from 'src/common/helpers/regex.helper';

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

  async createMediaRecord(dto: UploadMediaDto, uploadedBy: string) {
    const { name, url, category, linkedMenuItemIds = [] } = dto;

    const existing = await this.mediaModel.findOne({
      $or: [{ name }, { url }],
    });
    if (existing)
      throw new ConflictException(
        'A media item with the same name or URL already exists.',
      );

    await this.menuService.getCategory(category);
    await Promise.all(
      linkedMenuItemIds.map((id) => this.menuService.getItem(id)),
    );

    return await this.mediaModel.create({
      name,
      url,
      category,
      linkedMenuItemIds,
      uploadedBy,
    });
  }

  async findAll(filters: { category?: string; name?: string }) {
    const query: MediaFilterQuery = {};

    // Resolve category by ID or name
    if (filters.category) {
      const categoryDoc = mongoose.Types.ObjectId.isValid(filters.category)
        ? await this.menuService.getCategory(filters.category)
        : await this.menuService.getCategoryByName(filters.category);

      if (!categoryDoc) return []; // No matching category
      query.category = String(categoryDoc._id);
    }

    // Filter by name (partial, case-insensitive)
    if (filters.name) {
      const escapedName = escapeRegex(filters.name);
      query.name = { $regex: escapedName, $options: 'i' };
    }

    return this.mediaModel.find(query).sort({ createdAt: -1 });
  }
}
