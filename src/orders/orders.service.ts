import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Order, OrderDocument, OrderStatus } from './schemas/order.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CartService } from 'src/cart/cart.service';
import { PlaceFromCartDto } from './dto/place-from-cart.dto';
import { ReorderDto } from './dto/reorder.dto';
import { OrdersGateway } from './orders.gateway';

type OrderTransitionMap = {
  [K in OrderStatus]?: OrderStatus[];
};

export const allowedOrderTransitionMap: OrderTransitionMap = {
  [OrderStatus.PENDING]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCEL_REQUEST,
    OrderStatus.FAILED,
  ],
  [OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCEL_REQUEST],
  [OrderStatus.CANCEL_REQUEST]: [
    OrderStatus.CANCELLED,
    OrderStatus.REJECTED_CANCEL_REQUEST,
  ],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [
    OrderStatus.COMPLETED, // ORDER TYPE = DINE-IN
    OrderStatus.PICKED, // ORDER TYPE = TAKEAWAY
    OrderStatus.OUT_FOR_DELIVERY, // ORDER TYPE = DELIVERY
  ],
  [OrderStatus.PICKED]: [OrderStatus.COMPLETED],
  [OrderStatus.OUT_FOR_DELIVERY]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.REJECTED_CANCEL_REQUEST]: [],
  [OrderStatus.FAILED]: [],
};

export function canStatusTransit(from: OrderStatus, to: OrderStatus): boolean {
  return allowedOrderTransitionMap[from]?.includes(to) ?? false;
}

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly orderGateway: OrdersGateway,
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
      total,
      paymentMethod: dto.paymentMethod,
      paymentDetails: dto.paymentDetails,
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
      total,
      paymentMethod: dto.paymentMethod,
      paymentDetails: dto.paymentDetails,
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
      paymentMethod: dto.paymentMethod,
      paymentDetails: dto.paymentDetails,
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

    if (!order) throw new NotFoundException(`Order doesn't exist`);

    return order;
  }

  async getOrderByIdForAdmin(id: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid order ID: ${id}`);

    const order = await this.orderModel
      .findById(id)
      .populate('items.item')
      .populate('user')
      .exec();

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }

  async updateOrderStatus(id: string, dto: UpdateStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    const isValidNext = canStatusTransit(order.status, dto.status);

    if (!isValidNext)
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${dto.status}`,
      );

    order.status = dto.status;

    if (order.status === OrderStatus.CONFIRMED) {
      order.confirmedAt = new Date();
    } else if (order.status === OrderStatus.PREPARING) {
      order.preparedAt = new Date();
    } else if (order.status === OrderStatus.DELIVERED) {
      order.deliveredAt = new Date();
    }

    await order.save();

    this.orderGateway.emitOrderStatusUpdate(id, dto.status);

    return order;
  }

  async getAllOrders() {
    return await this.orderModel
      .find()
      .populate('user', 'email role')
      .populate('items.item', 'name price')
      .sort({ createdAt: -1 })
      .exec();
  }

  async requestCancel(orderId: string, userId: string) {
    const order = await this.getOrderById(orderId, userId);

    const isValidNext = canStatusTransit(
      order.status,
      OrderStatus.CANCEL_REQUEST,
    );

    if (!isValidNext)
      throw new BadRequestException(`Cannot cancel at this state`);

    order.status = OrderStatus.CANCEL_REQUEST;
    await order.save();
    this.orderGateway.emitOrderStatusUpdate(
      orderId,
      OrderStatus.CANCEL_REQUEST,
    );

    return order;
  }

  async approveOrRejectCancel(orderId: string, status: OrderStatus) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const isValidNext = canStatusTransit(order.status, status);

    if (!isValidNext)
      throw new BadRequestException(`Cannot cancel or reject at this state`);

    order.status = status;
    await order.save();
    this.orderGateway.emitOrderStatusUpdate(orderId, status);
    return order;
  }
}
