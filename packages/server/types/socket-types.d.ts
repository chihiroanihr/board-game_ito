import type { User, Room } from '@bgi/shared';

declare module 'socket.io' {
  interface Socket {
    sessionId: string;
    connected: boolean;
    user: User | null;
    room: Room | null;
  }
}
