import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Media } from './schemas/media.schema';
import { Model } from 'mongoose';
import { MenuService } from 'src/menu/menu.service';

@Injectable()
export class MediaService {
  constructor(
    @InjectModel(Media.name) private mediaModel: Model<Media>,
    private readonly menuService: MenuService,
  ) {}
}
