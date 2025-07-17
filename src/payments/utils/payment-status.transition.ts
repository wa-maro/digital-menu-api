import { PaymentMethod, PaymentStatus } from '../schema/payment.schema';

type CashPaymentTransitionMap = { [K in PaymentStatus]?: PaymentStatus[] };

const allowedCashPaymentTransitionMap: CashPaymentTransitionMap = {
  [PaymentStatus.PENDING_CONFIRMATION]: [
    PaymentStatus.PAID,
    PaymentStatus.CANCELLED,
  ],
  [PaymentStatus.PAID]: [PaymentStatus.REFUNDED],
  [PaymentStatus.REFUNDED]: [],
  [PaymentStatus.CANCELLED]: [],
};

export function canPaymentStatusTransit(
  from: PaymentStatus,
  to: PaymentStatus,
  method: PaymentMethod,
): boolean {
  switch (method) {
    case PaymentMethod.CASH:
      return allowedCashPaymentTransitionMap[from]?.includes(to) ?? false;
    case PaymentMethod.AZAMPESA:
      // TODO: Placeholder for online transition logic
      return false;
    default:
      throw new Error(`Unknown payment method: ${method}`);
  }
}
