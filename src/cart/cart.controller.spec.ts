import { Test, TestingModule } from '@nestjs/testing';
import { CustomerCartController } from './customer-cart.controller';

describe('CartController', () => {
  let controller: CustomerCartController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerCartController],
    }).compile();

    controller = module.get<CustomerCartController>(CustomerCartController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
