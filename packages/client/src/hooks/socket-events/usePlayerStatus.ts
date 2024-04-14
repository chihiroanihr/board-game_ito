import { useEffect } from 'react';

import {
  type PlayerInResponse,
  type PlayerOutResponse,
  type PlayerDisconnectedResponse,
  type PlayerReconnectedResponse,
  NamespaceEnum,
} from '@bgi/shared';
import { useSocket } from '@/hooks';

interface PlayerStatusCallback {
  onPlayerDisconnectedCallback?: ({ user }: PlayerDisconnectedResponse) => void;
  onPlayerReconnectedCallback?: ({ user }: PlayerReconnectedResponse) => void;
  onPlayerJoinedCallback?: ({ socketId, user, room }: PlayerInResponse) => void;
  onPlayerLeftCallback?: ({ socketId, user, room }: PlayerOutResponse) => void;
}

export const usePlayerStatus = ({
  onPlayerDisconnectedCallback,
  onPlayerReconnectedCallback,
  onPlayerJoinedCallback,
  onPlayerLeftCallback,
}: PlayerStatusCallback) => {
  const { socket } = useSocket();

  // Incoming socket event handler: Player disconnected
  useEffect(() => {
    const onPlayerDisconnected = ({ user }: PlayerDisconnectedResponse) => {
      onPlayerDisconnectedCallback?.({ user });
    };

    socket.on(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
    return () => socket.off(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
  }, [onPlayerDisconnectedCallback, socket]);

  // Incoming socket event handler: Player reconnected
  useEffect(() => {
    const onPlayerReconnected = ({ user }: PlayerReconnectedResponse) => {
      onPlayerReconnectedCallback?.({ user });
    };

    socket.on(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
    return () => socket.off(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
  }, [onPlayerReconnectedCallback, socket]);

  // Incoming socket event handler: Player joined room
  useEffect(() => {
    const onPlayerJoined = ({ socketId, user, room }: PlayerInResponse) => {
      onPlayerJoinedCallback?.({ socketId, user, room });
    };

    socket.on(NamespaceEnum.PLAYER_IN, onPlayerJoined);
    return () => socket.off(NamespaceEnum.PLAYER_IN, onPlayerJoined);
  }, [onPlayerJoinedCallback, socket]);

  // Incoming socket event handler: Player left room
  useEffect(() => {
    const onPlayerLeft = ({ socketId, user, room }: PlayerOutResponse) => {
      onPlayerLeftCallback?.({ socketId, user, room });
    };

    socket.on(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
    return () => socket.off(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
  }, [onPlayerLeftCallback, socket]);
};

// interface PlayerStatusCallback {
//   (player: User): void;
// }

// export const usePlayerDisconnected = (
//   onPlayerDisconnectedCallback: PlayerStatusCallback
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
//   onPlayerReconnectedCallback: PlayerStatusCallback
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
