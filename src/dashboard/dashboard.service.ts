import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { MenuItem, MenuItemDocument } from 'src/menu/schemas/item.schema';
import { Order, OrderDocument } from 'src/orders/schemas/order.schema';
import {
  Payment,
  PaymentDocument,
  PaymentStatus,
} from 'src/payments/schema/payment.schema';
import { User, UserDocument, UserRole } from 'src/users/schemas/user.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payment.name)
    private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(MenuItem.name)
    private readonly menuItemModel: Model<MenuItemDocument>,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async getSummary() {
    const [totalOrders, totalRevenue, totalMenuItems, activeUsers] =
      await Promise.all([
        this.orderModel.countDocuments(),
        this.paymentModel.aggregate([
          { $match: { status: PaymentStatus.PAID } },
          { $group: { _id: null, total: { $sum: '$amount' } } },
        ]),
        this.menuItemModel.countDocuments(),
        this.userModel.countDocuments({ role: UserRole.CUSTOMER }), // TODO: isActive: true or based on last login
      ]);

    return {
      totalOrders,
      totalRevenue: +(totalRevenue[0]?.total || 0).toFixed(2),
      totalMenuItems,
      activeUsers,
    };
  }

  async getRecentOrders() {
    // const twentyFourHoursAgo = new Date(Date.now() - 1024 * 60 * 60 * 1000);

    return (
      this.orderModel
        // .find({ createdAt: { $gte: twentyFourHoursAgo } })
        .find()
        .sort({ createdAt: -1 })
        .limit(20)
        .populate([
          { path: 'user', select: 'name email' },
          { path: 'items.item', select: 'name price' },
        ])
        .lean()
    );
  }
}
