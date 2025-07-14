import { Test, TestingModule } from '@nestjs/testing';
import { PublicMediaController } from './public-media.controller';

describe('MediaController', () => {
  let controller: PublicMediaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicMediaController],
    }).compile();

    controller = module.get<PublicMediaController>(PublicMediaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
