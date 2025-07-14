import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { PublicMediaController } from './public-media.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schemas/media.schema';
import { MenuModule } from 'src/menu/menu.module';
import { AdminMediaController } from './admin-media.controller';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    MenuModule,
  ],
  providers: [MediaService],
  controllers: [PublicMediaController, AdminMediaController],
  exports: [MongooseModule, MediaService],
})
export class MediaModule {}
