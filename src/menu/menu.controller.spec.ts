import { Test, TestingModule } from '@nestjs/testing';
import { PublicMenuController } from './public-menu.controller';

describe('MenuController', () => {
  let controller: PublicMenuController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicMenuController],
    }).compile();

    controller = module.get<PublicMenuController>(PublicMenuController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
