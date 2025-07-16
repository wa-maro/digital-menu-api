import { OrderStatus } from 'src/orders/schemas/order.schema';

export type OrderTransitionMap = { [K in OrderStatus]?: OrderStatus[] };

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
