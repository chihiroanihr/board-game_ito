import { Socket } from "socket.io";

export function logSocketEvent(eventType: string, socket: Socket) {
  if (process.env.NODE_ENV !== "production") {
    console.log(
      `[${eventType}]: \n- socketId: ${socket.id}\n- sessionId: ${socket.sessionId}`
    );
  }
}

export function logQueryEvent(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(`--- QUERY: ${message}`);
  }
}
