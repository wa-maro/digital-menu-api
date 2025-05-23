import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { isValidObjectId, Model } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    const items = dto.items.map((i) => ({
      item: i.itemId,
      quantity: i.quantity,
      customizations: i.customization,
      price: i.price,
    }));

    return await this.orderModel.create({
      user: userId,
      items,
      type: dto.type,
      deliveryAddress: dto.deliveryAddress,
      total,
    });
  }

  async getUserOrders(userId: string) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    return await this.orderModel
      .find({ user: userId })
      .populate('items.item')
      .exec();
  }

  async getOrderById(id: string, userId: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid order ID: ${id}`);

    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    const order = await this.orderModel
      .findOne({ _id: id, user: userId })
      .populate('items.item')
      .exec();

    if (!order)
      throw new NotFoundException(`Order with ID ${id} doesn't exist`);

    return order;
  }
}
