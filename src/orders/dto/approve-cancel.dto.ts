// dto/approve-cancel.dto.ts
import { IsEnum } from 'class-validator';
import { OrderStatus } from '../schemas/order.schema';

export class ApproveCancelDto {
  @IsEnum(OrderStatus, {
    message: 'status must be one of: cancelled, rejected_cancel_request',
  })
  status: OrderStatus;
}
