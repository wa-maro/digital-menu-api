import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from './schemas/media.schema';
import { Model } from 'mongoose';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MenuService } from 'src/menu/menu.service';

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
}
