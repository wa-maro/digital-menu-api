import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { MediaService } from './media.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

import { UploadMediaDto } from './dto/upload-media.dto';
import { UpdateMediaDto } from './dto/update-media.dto';
import { ImageUpload } from 'src/common/decorators/image-upload.decorator';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/media')
export class AdminMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('creation')
  @ImageUpload()
  async createMedia(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: UploadMediaDto,
    @Req() req: CustomRequest,
  ) {
    if (!file) throw new BadRequestException('Image file is required');

    return this.mediaService.createMediaFile(file, dto, req.user.userId);
  }

  @Patch(':id')
  @ImageUpload()
  async updateMedia(
    @Param('id') id: string,
    @Body() dto: UpdateMediaDto,
    @Req() req: CustomRequest,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.mediaService.updateMediaFile(id, req.user.userId, dto, file);
  }

  @Delete(':id')
  async deleteMedia(@Param('id') id: string) {
    return this.mediaService.deleteMediaFile(id);
  }
}
