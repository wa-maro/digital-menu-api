import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import {
  TransactionCounter,
  TransactionCounterDocument,
} from './schema/transaction-counter.schema';

@Injectable()
export class TransactionCounterService {
  constructor(
    @InjectModel(TransactionCounter.name)
    private transactionCounterModel: Model<TransactionCounterDocument>,
  ) {}

  async getNextTransactionNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const monthKey = `${year}${month}`;

    const result = await this.transactionCounterModel.findOneAndUpdate(
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

    const transactionNumber = String(result.lastNumber).padStart(6, '0');
    return `TXN-${monthKey}-${transactionNumber}`;
  }
}
