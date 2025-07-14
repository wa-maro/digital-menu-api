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
import { ImageUpload } from 'src/common/decorators/image-upload.decorator';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/media')
export class MediaController {
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

  @Get()
  async listMedia(@Query() query: FetchMediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  async getMedia(@Param('id') id: string) {
    return this.mediaService.findOneById(id);
  }
}
