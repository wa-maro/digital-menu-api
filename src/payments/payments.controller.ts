import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { AzamCallbackDto } from './dto/azampay-callback.dto';

@Controller('payments')
export class PublicPaymentContrller {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('callback')
  @HttpCode(HttpStatus.OK)
  async handleAzamPesaCallback(@Body() payload: AzamCallbackDto) {
    await this.paymentsService.processIncomingCallback(payload);
    return { status: 'received' };
  }
}
