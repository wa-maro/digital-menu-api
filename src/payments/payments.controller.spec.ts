import { Test, TestingModule } from '@nestjs/testing';
import { CustomerPaymentController } from './customer-payments.controller';

describe('PaymentsController', () => {
  let controller: CustomerPaymentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CustomerPaymentController],
    }).compile();

    controller = module.get<CustomerPaymentController>(
      CustomerPaymentController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
