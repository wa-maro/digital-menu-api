import { PaymentStatus } from 'src/orders/schemas/order.schema';

type ManualPaymentTransitionMap = { [K in PaymentStatus]?: PaymentStatus[] };

export const allowedManualPaymentTransitionMap: ManualPaymentTransitionMap = {
  [PaymentStatus.PENDING_CONFIRMATION]: [
    PaymentStatus.MANUAL_REVIEW,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.MANUAL_REVIEW]: [PaymentStatus.PAID],

  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.CANCELLED]: [],
  [PaymentStatus.FAILED]: [PaymentStatus.PENDING_CONFIRMATION],
  [PaymentStatus.TIMEOUT]: [PaymentStatus.PENDING_CONFIRMATION],
};

export function canPaymentStatusTransit(
  from: PaymentStatus,
  to: PaymentStatus,
  method: 'manual' | 'online',
): boolean {
  switch (method) {
    case 'manual':
      return allowedManualPaymentTransitionMap[from]?.includes(to) ?? false;
    case 'online':
      // TODO: Placeholder for online transition logic
      return false;
    default:
      throw new Error(`Unknown payment method: ${method}`);
  }
}
