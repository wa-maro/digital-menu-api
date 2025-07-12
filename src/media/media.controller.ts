import { Controller, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RoleGuard } from 'src/common/guards/roles.guard';
import { MediaService } from './media.service';
import { Roles } from 'src/common/decorators/roles.decorator';

@UseGuards(AuthGuard('jwt'), RoleGuard)
@Roles('manager', 'admin')
@Controller('admin/media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}
}
