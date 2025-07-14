import { Controller, Get, Param, Query } from '@nestjs/common';
import { MediaService } from './media.service';
import { FetchMediaQueryDto } from './dto/fetch-media.dto';

@Controller('media')
export class PublicMediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  async listMedia(@Query() query: FetchMediaQueryDto) {
    return this.mediaService.findAll(query);
  }

  @Get(':id')
  async getMedia(@Param('id') id: string) {
    return this.mediaService.findOneById(id);
  }
}
