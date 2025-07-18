import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  OrderType,
} from './schemas/order.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';
import { CartService } from 'src/cart/cart.service';
import { OrdersGateway } from './orders.gateway';
import { OrderCounterService } from './order-counter.service';
import { canStatusTransit } from 'src/orders/utils/order-status.transition';
import { PaymentsService } from 'src/payments/payments.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly orderCounterService: OrderCounterService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly cartService: CartService,
    private readonly orderGateway: OrdersGateway,

    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentService: PaymentsService,
  ) {}

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    // Compute total from items
    const total = dto.items.reduce(
      (sum, item) => sum + item.quantity * item.price,
      0,
    );

    // Map items to OrderItem schema
    const items = dto.items.map((i) => ({
      item: new Types.ObjectId(i.itemId),
      quantity: i.quantity,
      customizations: i.customization,
      price: i.price,
    }));

    const orderNumber = await this.orderCounterService.getNextOrderNumber();

    const orderData: Order = {
      user: new Types.ObjectId(userId),
      orderNumber,
      items,
      type: dto.type,
      contactPhone: dto.contactPhone,
      total,
      status: OrderStatus.PENDING,
      payments: [],
    };

    // Handle dine-in, takeaway, delivery specific fields
    if (dto.type === OrderType.DINE_IN) orderData.tableNumber = dto.tableNumber;

    if (dto.type === OrderType.TAKEAWAY) orderData.pickupTime = dto.pickupTime;

    if (dto.type === OrderType.DELIVERY) {
      orderData.contactPhone = dto.contactPhone;
      orderData.deliveryAddress = dto.deliveryAddress;
      orderData.deliveryLocation = dto.deliveryLocation;
    }

    const newOrder = new this.orderModel(orderData);

    const cashPayment = await this.paymentService.initializeCashPayment(
      new Types.ObjectId(String(newOrder._id)),
      total,
      orderData.contactPhone,
    );
    newOrder.payments.push(new Types.ObjectId(String(cashPayment._id)));

    await newOrder.save();

    // Clear the user's cart
    await this.cartService.clearCartItems(userId);

    return newOrder;
  }

  async getUserOrders(userId: string) {
    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    return await this.orderModel
      .find({ user: new Types.ObjectId(userId) })
      .populate('items.item')
      .lean()
      .exec();
  }

  async getOrderById(id: string, userId: string) {
    if (!isValidObjectId(id))
      throw new BadRequestException(`Invalid order ID: ${id}`);

    if (!isValidObjectId(userId))
      throw new BadRequestException('Invalid user ID');

    const order = await this.orderModel
      .findOne({ _id: id, user: new Types.ObjectId(userId) })
      .populate('items.item')
      .lean()
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
      .lean()
      .exec();

    if (!order) throw new NotFoundException('Order not found');

    return order;
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException(`Order with ID ${id} not found`);

    const isValidNext = canStatusTransit(order.status, status);

    if (!isValidNext)
      throw new BadRequestException(
        `Invalid status transition from ${order.status} to ${status}`,
      );

    order.status = status;
    const now = new Date();

    if (order.status === OrderStatus.CONFIRMED) {
      order.confirmedAt = now;
    } else if (order.status === OrderStatus.PREPARING) {
      order.preparedAt = now;
    } else if (order.status === OrderStatus.DELIVERED) {
      order.deliveredAt = now;
    }

    await order.save();

    this.orderGateway.emitOrderStatusUpdate(id, status);

    return this.getOrderByIdForAdmin(id);
  }

  async getAllOrders() {
    return await this.orderModel
      .find()
      .populate('user', 'fullName email')
      .populate('items.item', 'name price')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  async requestCancel(orderId: string, userId: string) {
    const order = await this.orderModel.findOne({
      _id: orderId,
      user: new Types.ObjectId(userId),
    });

    if (!order) throw new NotFoundException(`Order not found`);

    if (order.status === OrderStatus.CANCEL_REQUEST) return order;

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
