import { Test, TestingModule } from '@nestjs/testing';
import { PublicRestaurantController } from './public-restaurant.controller';

describe('RestaurantController', () => {
  let controller: PublicRestaurantController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PublicRestaurantController],
    }).compile();

    controller = module.get<PublicRestaurantController>(
      PublicRestaurantController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
