import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Media, MediaSchema } from './schemas/media.schema';
import { MenuModule } from 'src/menu/menu.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Media.name, schema: MediaSchema }]),
    MenuModule,
  ],
  providers: [MediaService],
  controllers: [MediaController],
  exports: [MongooseModule, MediaService],
})
export class MediaModule {}
