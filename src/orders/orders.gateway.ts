import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { OrderStatus } from './schemas/order.schema';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class OrdersGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client connected ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected ${client.id}`);
  }

  emitOrderStatusUpdate(orderId: string, status: OrderStatus) {
    this.server.emit(`order-status-${orderId}`, { orderId, status });
  }
}
