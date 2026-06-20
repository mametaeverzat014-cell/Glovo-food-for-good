import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

export interface OffersChangedPayload {
  restaurantId?: string;
  offerId?: string;
}

/**
 * Broadcasts live inventory changes to all connected clients so the
 * marketplace can update stock in real time.
 */
@WebSocketGateway({ cors: { origin: true } })
export class EventsGateway {
  @WebSocketServer() server?: Server;

  emitOffersChanged(payload: OffersChangedPayload = {}) {
    this.server?.emit('offers:changed', payload);
  }
}
