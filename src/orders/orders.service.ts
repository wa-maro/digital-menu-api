import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument, OrderType } from './schemas/order.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CartService } from 'src/cart/cart.service';
import { PlaceFromCartDto } from './dto/place-from-cart.dto';
import { ReorderDto } from './dto/reorder.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
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

  async placeOrderFromCart(userId: string, dto: PlaceFromCartDto) {
    const cart = await this.cartService.getUserCart(userId);
    if (!cart) throw new NotFoundException('Cart is empty');

    const items = cart.items.map((i) => ({
      item: new Types.ObjectId(i.item),
      quantity: i.quantity,
      customizations: i.customizations,
      price: i.price,
    }));
    const total = items.reduce(
      (sum, { quantity, price }) => sum + quantity * price,
      0,
    );

    const order = new this.orderModel({
      user: userId,
      items,
      type: dto.type,
      deliveryAddress: dto.deliveryAddress,
      total,
    });
    await order.save();
    await this.cartService.clearCart(userId);

    return order;
  }

  async reorderFromPast(userId: string, orderId: string, dto: ReorderDto) {
    const previousOrder = await this.orderModel.findOne({
      _id: orderId,
      user: userId,
    });
    if (!previousOrder) throw new NotFoundException('Order not found');

    const clonedItem = previousOrder.items.map((i) => ({
      item: i.item,
      quantity: i.quantity,
      customizations: i.customizations,
      price: i.price,
    }));
    const total = clonedItem.reduce(
      (sum, { quantity, price }) => sum + quantity * price,
      0,
    );

    const newOrder = new this.orderModel({
      user: userId,
      items: clonedItem,
      type: dto.type || previousOrder.type,
      deliveryAddress: dto.deliveryAddress || previousOrder.deliveryAddress,
      total,
    });

    return newOrder.save();
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

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      { status: dto.status },
      { new: true },
    );
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    return order;
  }

  async getAllOrders() {
    return await this.orderModel.find().exec();
  }
}
