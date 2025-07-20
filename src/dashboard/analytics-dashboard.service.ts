import { BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
} from 'src/orders/schemas/order.schema';
import {
  Payment,
  PaymentDocument,
  PaymentMethod,
  PaymentStatus,
} from 'src/payments/schema/payment.schema';
import moment from 'moment-timezone';

export class AnalyticsDashboardService {
  constructor(
    @InjectModel(Payment.name) private paymentModel: Model<PaymentDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
  ) {}

  async getRevenueData({
    month,
    week,
    method,
  }: {
    month?: string;
    week?: string;
    method?: PaymentMethod;
  }) {
    if (month) return this.getMonthlyRevenueBreakdown(month, method);

    if (week) return this.getWeeklyRevenueBreakdown(week, method);

    throw new BadRequestException('Provide either month or ISO week');
  }

  private async getMonthlyRevenueBreakdown(
    month: string,
    method?: PaymentMethod,
  ) {
    // Example: month = "2025-07"
    const startDate = moment
      .tz(month, 'YYYY-MM', 'Africa/Dar_es_Salaam')
      .startOf('month')
      .toDate();
    const endDate = moment(startDate)
      .endOf('month')
      .add(1, 'day')
      .startOf('day')
      .toDate();

    const matchStage: any = {
      status: PaymentStatus.PAID,
      paidAt: { $gte: startDate, $lt: endDate },
    };
    if (method) matchStage.paymentMethod = method;

    const payments = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          localWeek: {
            $isoWeek: {
              date: '$paidAt',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
          localYear: {
            $year: {
              date: '$paidAt',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
        },
      },
      {
        $group: {
          _id: {
            week: '$localWeek',
            year: '$localYear',
          },
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    const orders = await this.orderModel.aggregate([
      {
        $match: {
          status: OrderStatus.COMPLETED,
          createdAt: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $addFields: {
          localWeek: {
            $isoWeek: {
              date: '$createdAt',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
          localYear: {
            $year: {
              date: '$createdAt',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
        },
      },
      {
        $group: {
          _id: {
            week: '$localWeek',
            year: '$localYear',
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.week': 1 } },
    ]);

    return this.combinePaymentsAndOrders(payments, orders, 'Week');
  }

  private async getWeeklyRevenueBreakdown(
    isoWeek: string,
    method?: PaymentMethod,
  ) {
    // Example: week = "2025-W29"
    const [yearStr, weekStr] = isoWeek.split('-W');
    const start = moment
      .tz(`${yearStr}-01-01`, 'YYYY-MM-DD', 'Africa/Dar_es_Salaam')
      .isoWeek(parseInt(weekStr))
      .startOf('isoWeek');
    const end = moment(start).add(1, 'week');

    const matchStage: any = {
      status: PaymentStatus.PAID,
      paidAt: { $gte: start.toDate(), $lt: end.toDate() },
    };
    if (method) matchStage.paymentMethod = method;

    const payments = await this.paymentModel.aggregate([
      { $match: matchStage },
      {
        $addFields: {
          localDay: {
            $dateToString: {
              date: '$paidAt',
              format: '%Y-%m-%d',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
        },
      },
      {
        $group: {
          _id: '$localDay',
          totalRevenue: { $sum: '$amount' },
          paymentCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const orders = await this.orderModel.aggregate([
      {
        $match: {
          status: OrderStatus.COMPLETED,
          createdAt: { $gte: start.toDate(), $lt: end.toDate() },
        },
      },
      {
        $addFields: {
          localDay: {
            $dateToString: {
              date: '$createdAt',
              format: '%Y-%m-%d',
              timezone: 'Africa/Dar_es_Salaam',
            },
          },
        },
      },
      {
        $group: {
          _id: '$localDay',
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return this.combinePaymentsAndOrders(payments, orders, 'Day');
  }

  private combinePaymentsAndOrders(
    payments: any[],
    orders: any[],
    labelPrefix: 'Week' | 'Day',
  ) {
    const map: Record<string, any> = {};

    for (const p of payments) {
      const label = `${labelPrefix} ${p._id.week || p._id}`; // e.g., "Week 29" or "Day 2025-07-15"
      map[label] = {
        label,
        totalRevenue: p.totalRevenue,
        paymentCount: p.paymentCount,
        orderCount: 0,
      };
    }

    for (const o of orders) {
      const label = `${labelPrefix} ${o._id.week || o._id}`;
      if (!map[label]) {
        map[label] = {
          label,
          totalRevenue: 0,
          paymentCount: 0,
          orderCount: o.orderCount,
        };
      } else {
        map[label].orderCount = o.orderCount;
      }
    }

    const sorted = Object.values(map).sort((a, b) =>
      a.label.localeCompare(b.label),
    );

    return {
      labels: sorted.map((x) => x.label),
      revenue: sorted.map((x) => x.totalRevenue),
      orders: sorted.map((x) => x.orderCount),
      avgOrderValue: sorted.map((x) =>
        x.orderCount > 0
          ? parseFloat((x.totalRevenue / x.orderCount).toFixed(2))
          : 0,
      ),
    };
  }
}
