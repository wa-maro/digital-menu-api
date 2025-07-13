import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { MediaService } from './media.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

import { UploadMediaDto } from './dto/upload-media.dto';
import { FetchMediaQueryDto } from './dto/fetch-media.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateMediaDto } from './dto/update-media.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('creation')
  async createMedia(@Body() dto: UploadMediaDto, @Req() req: CustomRequest) {
    return this.mediaService.createMediaRecord(dto, req.user.userId);
  }

  @Get()
  async listMedia(@Query() query: FetchMediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  async getMedia(@Param('id') id: string) {
    return this.mediaService.findOneById(id);
  }

  @Patch(':id')
  async updateMedia(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.updateMedia(id, dto);
  }

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/media',
        filename: (req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async uploadMediaFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');

    const url = `/uploads/media/${file.filename}`;

    return {
      message: 'File uploaded successfully',
      url,
      filename: file.filename,
    };
  }
}
