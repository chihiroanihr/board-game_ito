import { Socket } from "socket.io";

export function logSocketEvent(eventType: string, socket: Socket) {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `\n[${eventType}]: 
      socketId: ${socket.id}
      sessionId: ${socket.sessionId}
      userId: ${socket.user?._id ?? null}
      roomId: ${socket.room?._id ?? null}`
    );
  }
}

export function logQueryEvent(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`\nQUERY: ${message}`);
  }
}
