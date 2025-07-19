import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';

@Controller('payments')
export class PublicPaymentContrller {
  @Post('callback')
  @HttpCode(HttpStatus.OK)
  handleAzamPesaCallback(@Body() payload: any) {
    console.log('Received AzamPesa callback:', payload);
    // Process the payload (e.g., update order/payment status)
    return { status: 'received' };
  }
}
