import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { MediaService } from './media.service';
import { Roles } from 'src/common/decorators/roles.decorator';
import { CustomRequest } from 'src/interfaces/custom-request.interface';

import { UploadMediaDto } from './dto/upload-media.dto';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('creation')
  async createMedia(@Body() dto: UploadMediaDto, @Req() req: CustomRequest) {
    const uploadedBy = req.user.userId;
    return this.mediaService.createMediaRecord(dto, uploadedBy);
  }
}
