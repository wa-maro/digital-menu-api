import { PartialType } from '@nestjs/mapped-types';
import { UploadMediaDto } from './upload-media.dto';

export class UpdateMediaDto extends PartialType(UploadMediaDto) {}
