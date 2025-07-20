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

  async getTopPerforming({
    type = 'day',
    sortBy = 'revenue',
    startDate,
    endDate,
    method,
  }: {
    type: 'day' | 'week';
    sortBy: 'revenue' | 'orders';
    startDate: string;
    endDate: string;
    method?: PaymentMethod;
  }) {
    if (!startDate || !endDate) {
      throw new BadRequestException('startDate and endDate are required');
    }

    const start = moment
      .tz(startDate, 'Africa/Dar_es_Salaam')
      .startOf('day')
      .toDate();
    const end = moment
      .tz(endDate, 'Africa/Dar_es_Salaam')
      .endOf('day')
      .toDate();

    const paymentMatch: any = {
      status: PaymentStatus.PAID,
      paidAt: { $gte: start, $lte: end },
    };
    if (method) paymentMatch.paymentMethod = method;

    const payments = await this.paymentModel.aggregate([
      { $match: paymentMatch },
      {
        $addFields: {
          groupLabel:
            type === 'week'
              ? {
                  $isoWeek: {
                    date: '$paidAt',
                    timezone: 'Africa/Dar_es_Salaam',
                  },
                }
              : {
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
          _id: '$groupLabel',
          totalRevenue: { $sum: '$amount' },
        },
      },
    ]);

    const orders = await this.orderModel.aggregate([
      {
        $match: {
          status: OrderStatus.COMPLETED,
          createdAt: { $gte: start, $lte: end },
        },
      },
      {
        $addFields: {
          groupLabel:
            type === 'week'
              ? {
                  $isoWeek: {
                    date: '$createdAt',
                    timezone: 'Africa/Dar_es_Salaam',
                  },
                }
              : {
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
          _id: '$groupLabel',
          orderCount: { $sum: 1 },
        },
      },
    ]);

    // Merge
    const map = new Map<string, any>();

    for (const p of payments) {
      map.set(p._id.toString(), {
        label: type === 'week' ? `Week ${p._id}` : p._id,
        totalRevenue: p.totalRevenue,
        orderCount: 0,
      });
    }

    for (const o of orders) {
      const key = o._id.toString();
      if (map.has(key)) {
        map.get(key).orderCount = o.orderCount;
      } else {
        map.set(key, {
          label: type === 'week' ? `Week ${key}` : key,
          totalRevenue: 0,
          orderCount: o.orderCount,
        });
      }
    }

    // Sort
    const all = Array.from(map.values());
    const sorted = all.sort((a, b) =>
      sortBy === 'revenue'
        ? b.totalRevenue - a.totalRevenue
        : b.orderCount - a.orderCount,
    );

    return sorted.slice(0, 3); // Top 3
  }

  async getComparison({
    type = 'month',
    method,
  }: {
    type: 'month' | 'week';
    method?: PaymentMethod;
  }) {
    const now = moment.tz('Africa/Dar_es_Salaam');

    let currentRange: { start: Date; end: Date; label: string };
    let previousRange: { start: Date; end: Date; label: string };

    if (type === 'month') {
      currentRange = {
        start: now.clone().startOf('month').toDate(),
        end: now.clone().endOf('month').add(1, 'day').startOf('day').toDate(),
        label: now.format('MMMM YYYY'),
      };
      previousRange = {
        start: now.clone().subtract(1, 'month').startOf('month').toDate(),
        end: now
          .clone()
          .subtract(1, 'month')
          .endOf('month')
          .add(1, 'day')
          .startOf('day')
          .toDate(),
        label: now.clone().subtract(1, 'month').format('MMMM YYYY'),
      };
    } else {
      currentRange = {
        start: now.clone().startOf('isoWeek').toDate(),
        end: now.clone().endOf('isoWeek').add(1, 'day').startOf('day').toDate(),
        label: `Week ${now.isoWeek()} (${now.format('YYYY')})`,
      };
      previousRange = {
        start: now.clone().subtract(1, 'week').startOf('isoWeek').toDate(),
        end: now
          .clone()
          .subtract(1, 'week')
          .endOf('isoWeek')
          .add(1, 'day')
          .startOf('day')
          .toDate(),
        label: `Week ${now.clone().subtract(1, 'week').isoWeek()} (${now.format('YYYY')})`,
      };
    }

    const [current, previous] = await Promise.all([
      this.getRevenueAndOrders(currentRange.start, currentRange.end, method),
      this.getRevenueAndOrders(previousRange.start, previousRange.end, method),
    ]);

    const revenueChange = this.calcPercentChange(
      previous.totalRevenue,
      current.totalRevenue,
    );
    const orderChange = this.calcPercentChange(
      previous.orderCount,
      current.orderCount,
    );

    return {
      period: type,
      current: { ...current, label: currentRange.label },
      previous: { ...previous, label: previousRange.label },
      change: {
        revenuePercent: revenueChange,
        orderPercent: orderChange,
        direction: {
          revenue:
            revenueChange > 0 ? 'up' : revenueChange < 0 ? 'down' : 'same',
          orders: orderChange > 0 ? 'up' : orderChange < 0 ? 'down' : 'same',
        },
      },
    };
  }

  private async getRevenueAndOrders(
    start: Date,
    end: Date,
    method?: PaymentMethod,
  ) {
    const paymentMatch: any = {
      status: PaymentStatus.PAID,
      paidAt: { $gte: start, $lt: end },
    };
    if (method) paymentMatch.paymentMethod = method;

    const [paymentAgg, orderAgg] = await Promise.all([
      this.paymentModel.aggregate([
        { $match: paymentMatch },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$amount' },
          },
        },
      ]),
      this.orderModel.aggregate([
        {
          $match: {
            status: OrderStatus.COMPLETED,
            createdAt: { $gte: start, $lt: end },
          },
        },
        {
          $group: {
            _id: null,
            orderCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    return {
      totalRevenue: paymentAgg[0]?.totalRevenue || 0,
      orderCount: orderAgg[0]?.orderCount || 0,
    };
  }

  private calcPercentChange(previous: number, current: number): number {
    if (previous === 0) return current === 0 ? 0 : 100;
    return parseFloat((((current - previous) / previous) * 100).toFixed(2));
  }
}
