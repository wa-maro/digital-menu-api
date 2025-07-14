import {
  applyDecorators,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { basename } from 'path';

export function ImageUpload(fieldName = 'file') {
  return applyDecorators(
    UseInterceptors(
      FileInterceptor(fieldName, {
        storage: diskStorage({
          destination: './uploads/media',
          filename: (req, file, callback) => {
            const safeName = basename(file.originalname).replace(/\s+/g, '_');
            callback(null, safeName);
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
    ),
  );
}
