import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Order,
  OrderDocument,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './schemas/order.schema';
import { isValidObjectId, Model, Types } from 'mongoose';
import { PlaceOrderDto } from './dto/place-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CartService } from 'src/cart/cart.service';
import { PlaceFromCartDto } from './dto/place-from-cart.dto';
import { ReorderDto } from './dto/reorder.dto';
import { OrdersGateway } from './orders.gateway';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';
import { ManualPaymentConfirmationDto } from 'src/payments/dto/manual-payment-confirmation.dto';
import { PaymentStatusQueryDto } from 'src/payments/dto/payment-status-query.dto';

type OrderTransitionMap = { [K in OrderStatus]?: OrderStatus[] };

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

    const initialPaymentStatus =
      dto.paymentMethod === PaymentMethod.CASH
        ? PaymentStatus.PENDING
        : PaymentStatus.PENDING;

    return await this.orderModel.create({
      user: userId,
      items,
      type: dto.type,
      total,
      paymentMethod: dto.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentLog: [
        {
          status: initialPaymentStatus,
          timestamp: new Date(),
          message: 'Order placed',
        },
      ],
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

    const initialPaymentStatus =
      dto.paymentMethod === PaymentMethod.CASH
        ? PaymentStatus.PENDING
        : PaymentStatus.PENDING;

    const order = new this.orderModel({
      user: userId,
      items,
      type: dto.type,
      total,
      paymentMethod: dto.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentLog: [
        {
          status: initialPaymentStatus,
          timestamp: new Date(),
          message: 'Order placed',
        },
      ],
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

    const initialPaymentStatus =
      dto.paymentMethod === PaymentMethod.CASH
        ? PaymentStatus.PENDING // Awaiting cash on delivery/pickup
        : PaymentStatus.PENDING; // Will be updated on AzamPesa confirmation

    const newOrder = new this.orderModel({
      user: userId,
      items: clonedItem,
      type: dto.type || previousOrder.type,
      paymentMethod: dto.paymentMethod,
      paymentStatus: initialPaymentStatus,
      paymentLog: [
        {
          status: initialPaymentStatus,
          timestamp: new Date(),
          message: 'Order placed',
        },
      ],
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
      .lean()
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

  async updatePaymentStatus(orderId: string, dto: UpdatePaymentStatusDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    order.paymentStatus = dto.status;
    order.paymentDetails ??= {};

    if (dto.transactionId)
      order.paymentDetails.transactionId = dto.transactionId;

    if (dto.userEnteredTransactionId)
      order.paymentDetails.userEnteredTransactionId =
        dto.userEnteredTransactionId;

    if (dto.paidAt) order.paymentDetails.paidAt = dto.paidAt;

    order.paymentLog = [
      ...(order.paymentLog || []),
      {
        status: dto.status,
        timestamp: new Date(),
        message: dto.message || '',
      },
    ];

    await order.save();
    return order;
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

  async confirmManualPayment(
    orderId: string,
    dto: ManualPaymentConfirmationDto,
  ) {
    if (!isValidObjectId(orderId))
      throw new BadRequestException('Invalid order ID');

    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    // Prevent confirming already paid/cancelled/failed orders
    if (
      [
        PaymentStatus.PAID,
        PaymentStatus.FAILED,
        PaymentStatus.CANCELLED,
      ].includes(order.paymentStatus)
    ) {
      throw new BadRequestException(
        `Cannot manually confirm a payment in '${order.paymentStatus}' status`,
      );
    }

    order.paymentStatus = PaymentStatus.MANUAL_REVIEW;
    order.paymentDetails ??= {};
    order.paymentDetails.userEnteredTransactionId = dto.transactionId;
    order.paymentDetails.phoneNumber = dto.phoneNumber;
    order.paymentDetails.paidAt = new Date();

    order.paymentLog = [
      ...(order.paymentLog || []),
      {
        status: PaymentStatus.MANUAL_REVIEW,
        timestamp: new Date(),
        message: 'Manual payment confirmation submitted',
      },
    ];

    await order.save();
    return order;
  }

  async queryPaymentStatus(dto: PaymentStatusQueryDto) {
    if (!dto.orderId && !dto.transactionId)
      throw new BadRequestException(
        'At least one of orderId or transactionId is required',
      );

    const query: any = {};

    if (dto.orderId) {
      if (!isValidObjectId(dto.orderId))
        throw new BadRequestException('Invalid order ID');
      query._id = dto.orderId;
    }

    if (dto.transactionId) {
      query['paymentDetails.transactionId'] = dto.transactionId;
    }

    const order = await this.orderModel
      .findOne(query)
      .populate('user', 'email')
      .populate('items.item', 'name')
      .lean();

    if (!order) throw new NotFoundException('Order not found');

    return {
      orderId: order._id,
      user: order.user,
      paymentStatus: order.paymentStatus,
      transactionId: order.paymentDetails?.transactionId,
      userEnteredTransactionId: order.paymentDetails?.userEnteredTransactionId,
      paidAt: order.paymentDetails?.paidAt,
      phoneNumber: order.paymentDetails?.phoneNumber,
      total: order.total,
      type: order.type,
      paymentMethod: order.paymentMethod,
      statusHistory: order.paymentLog,
    };
  }
}
