import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  OrderCounter,
  OrderCounterDocument,
} from './schemas/order-counter.schema';

@Injectable()
export class OrderCounterService {
  constructor(
    @InjectModel(OrderCounter.name)
    private orderCounterModel: Model<OrderCounterDocument>,
  ) {}

  async getNextOrderNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}${month}`;

    const result = await this.orderCounterModel.findOneAndUpdate(
      { month: monthKey },
      [
        {
          $set: {
            month: monthKey,
            lastNumber: { $add: [{ $ifNull: ['$lastNumber', 0] }, 1] },
          },
        },
      ],
      {
        new: true,
        upsert: true,
      },
    );

    const orderNumber = String(result.lastNumber).padStart(4, '0');
    return `ORD-${monthKey}-${orderNumber}`;
  }
}
