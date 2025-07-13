import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from './schemas/media.schema';
import mongoose, { isValidObjectId, Model } from 'mongoose';
import { UploadMediaDto } from './dto/upload-media.dto';
import { MenuService } from 'src/menu/menu.service';
import { escapeRegex } from 'src/common/helpers/regex.helper';
import { FetchMediaQueryDto } from './dto/fetch-media.dto';
import { firebaseStorage } from 'src/firebase/firebase.config';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

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
        select: 'name price',
      })
      .populate({ path: 'uploadedBy', select: 'fullName email' })
      .lean()
      .exec();
    if (!media) {
      throw new NotFoundException(`Media with ID "${id}" not found.`);
    }

    return media;
  }

  // async uploadToFirebase(file: Express.Multer.File, uploadedBy: string) {
  //   const fileName = `${Date.now()}_${uuidv4()}${path.extname(file.originalname)}`;
  //   const fileUpload = firebaseStorage.file(`media/${fileName}`);

  //   const stream = fileUpload.createWriteStream({
  //     metadata: {
  //       contentType: file.mimetype,
  //       metadata: {
  //         firebaseStorageDownloadTokens: uuidv4(),
  //       },
  //     },
  //   });

  //   return new Promise((resolve, reject) => {
  //     stream.on('error', (error) => {
  //       console.error(error);
  //       reject(new InternalServerErrorException('Failed to upload file'));
  //     });

  //     stream.on('finish', async () => {
  //       const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${firebaseStorage.name}/o/${encodeURIComponent(
  //         fileUpload.name,
  //       )}?alt=media`;
  //       resolve({
  //         url: publicUrl,
  //         name: file.originalname,
  //         uploadedBy,
  //       });
  //     });

  //     stream.end(file.buffer);
  //   });
  // }
}
