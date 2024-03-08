import { Socket } from 'socket.io';

export function logSocketEvent(eventType: string, socket: Socket) {
  console.log(
    `\n[${eventType}]: 
      socketId: ${socket.id}
      sessionId: ${socket.sessionId}
      userId: ${socket.user?._id ?? null}
      roomId: ${socket.room?._id ?? null}`
  );
}

export function logQueryEvent(message: string) {
  console.log(`\nQUERY: ${message}`);
}
