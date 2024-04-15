import { useEffect } from 'react';

import {
  type PlayerInResponse,
  type PlayerOutResponse,
  type PlayerDisconnectedResponse,
  type PlayerReconnectedResponse,
  type PlayerMicReadyResponse,
  NamespaceEnum,
} from '@bgi/shared';
import { useSocket } from '@/hooks';

interface PlayerStatusCallback {
  onPlayerDisconnectedCallback?: (data: PlayerDisconnectedResponse) => void;
  onPlayerReconnectedCallback?: (data: PlayerReconnectedResponse) => void;
  onPlayerJoinedCallback?: (data: PlayerInResponse) => void;
  onPlayerLeftCallback?: (data: PlayerOutResponse) => void;
  onPlayerMicReadyCallback?: (data: { socketId: string }) => void;
}

export const usePlayerStatus = ({
  onPlayerDisconnectedCallback,
  onPlayerReconnectedCallback,
  onPlayerJoinedCallback,
  onPlayerLeftCallback,
  onPlayerMicReadyCallback,
}: PlayerStatusCallback) => {
  const { socket } = useSocket();

  /**
   * Incoming socket event handler: Player disconnected
   */
  useEffect(() => {
    const onPlayerDisconnected = ({ socketId, user }: PlayerDisconnectedResponse) => {
      onPlayerDisconnectedCallback?.({ socketId, user });
    };

    socket.on(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
    return () => socket.off(NamespaceEnum.PLAYER_DISCONNECTED, onPlayerDisconnected);
  }, [onPlayerDisconnectedCallback, socket]);

  /**
   * Incoming socket event handler: Player reconnected
   */
  useEffect(() => {
    const onPlayerReconnected = ({ socketId, user }: PlayerReconnectedResponse) => {
      onPlayerReconnectedCallback?.({ socketId, user });
    };

    socket.on(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
    return () => socket.off(NamespaceEnum.PLAYER_RECONNECTED, onPlayerReconnected);
  }, [onPlayerReconnectedCallback, socket]);

  /**
   * Incoming socket event handler: Player joined room
   */
  useEffect(() => {
    const onPlayerJoined = ({ socketId, user, room }: PlayerInResponse) => {
      onPlayerJoinedCallback?.({ socketId, user, room });
    };

    socket.on(NamespaceEnum.PLAYER_IN, onPlayerJoined);
    return () => socket.off(NamespaceEnum.PLAYER_IN, onPlayerJoined);
  }, [onPlayerJoinedCallback, socket]);

  /**
   * Incoming socket event handler: Player left room
   */
  useEffect(() => {
    const onPlayerLeft = ({ socketId, user, room }: PlayerOutResponse) => {
      onPlayerLeftCallback?.({ socketId, user, room });
    };

    socket.on(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
    return () => socket.off(NamespaceEnum.PLAYER_OUT, onPlayerLeft);
  }, [onPlayerLeftCallback, socket]);

  /**
   * Incoming socket event handler: Player voice ready
   */
  useEffect(() => {
    const onPlayerMicReady = ({ socketId }: PlayerMicReadyResponse) => {
      onPlayerMicReadyCallback?.({ socketId });
    };

    socket.on(NamespaceEnum.PLAYER_MIC_READY, onPlayerMicReady);
    return () => socket.off(NamespaceEnum.PLAYER_MIC_READY, onPlayerMicReady);
  }, [onPlayerMicReadyCallback, socket]);
};
