import { useEffect } from 'react';

import {
  type User,
  type PlayerDisconnectedResponse,
  type PlayerReconnectedResponse,
  NamespaceEnum,
} from '@bgi/shared';
import { useSocket } from '@/hooks';

interface PlayerConnectionStatusCallback {
  onPlayerDisconnectedCallback: (player: User) => void;
  onPlayerReconnectedCallback: (player: User) => void;
}

export const usePlayerConnectionStatus = ({
  onPlayerDisconnectedCallback,
  onPlayerReconnectedCallback,
}: PlayerConnectionStatusCallback) => {
  const { socket } = useSocket();

  // Incoming socket event handler: Player Disconnected
  useEffect(() => {
    const onPlayerDisconnected = ({ user: player }: PlayerDisconnectedResponse) => {
      onPlayerDisconnectedCallback?.(player);
    };

    socket.on(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
    return () => socket.off(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
  }, [onPlayerDisconnectedCallback, socket]);

  // Incoming socket event handler: Player Reconnected
  useEffect(() => {
    const onPlayerReconnected = ({ user: player }: PlayerReconnectedResponse) => {
      onPlayerReconnectedCallback?.(player);
    };

    socket.on(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
    return () => socket.off(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
  }, [onPlayerReconnectedCallback, socket]);
};

// interface PlayerConnectionStatusCallback {
//   (player: User): void;
// }

// export const usePlayerDisconnected = (
//   onPlayerDisconnectedCallback: PlayerConnectionStatusCallback
// ) => {
//   const { socket } = useSocket();

//   useEffect(() => {
//     const onPlayerDisconnected = ({ user: player }: PlayerDisconnectedResponse) => {
//       onPlayerDisconnectedCallback(player);
//     };

//     socket.on(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
//     return () => socket.off(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
//   }, [onPlayerDisconnectedCallback, socket]);
// };

// export const usePlayerReconnected = (
//   onPlayerReconnectedCallback: PlayerConnectionStatusCallback
// ) => {
//   const { socket } = useSocket();

//   useEffect(() => {
//     const onPlayerReconnected = ({ user: player }: PlayerReconnectedResponse) => {
//       onPlayerReconnectedCallback(player);
//     };

//     socket.on(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
//     return () => socket.off(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
//   }, [onPlayerReconnectedCallback, socket]);
// };
