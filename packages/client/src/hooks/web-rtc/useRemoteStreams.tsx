import React, {
  type ReactNode,
  type Context,
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from 'react';

import { type RemotePeerDataType } from '../../enum';

type RemoteStreamsProviderProps = {
  children: ReactNode;
};

type RemoteStreamsContextType = {
  remoteStreams: Record<string, RemotePeerDataType>;
  addRemoteStream: (strPlayerId: string, stream: MediaStream) => void;
  removeRemoteStream: (strPlayerId: string) => void;
  removeAllRemoteStreams: () => void;
};

const RemoteStreamsContext: Context<RemoteStreamsContextType | undefined> = createContext<
  RemoteStreamsContextType | undefined
>(undefined);

export const RemoteStreamsProvider: React.FC<RemoteStreamsProviderProps> = ({ children }) => {
  const [remoteStreams, setRemoteStreams] = useState<Record<string, RemotePeerDataType>>({});

  const addRemoteStream = useCallback((strPlayerId: string, stream: MediaStream) => {
    setRemoteStreams((prevStreams) => ({
      ...prevStreams,
      [strPlayerId]: { stream, isMuted: true },
    }));
  }, []);

  const removeRemoteStream = useCallback((strPlayerId: string) => {
    setRemoteStreams((prevStreams) => {
      const { [strPlayerId]: _, ...rest } = prevStreams; // Remove the key
      return rest;
    });
  }, []);

  const removeAllRemoteStreams = useCallback(() => {
    setRemoteStreams({});
  }, []);

  const setRemoteMuteState = useCallback((strPlayerId: string, isMuted: boolean) => {
    setRemoteStreams((prevStreams) => {
      const peerData = prevStreams[strPlayerId];
      if (peerData) {
        return {
          ...prevStreams,
          [strPlayerId]: { ...peerData, isMuted },
        };
      }
      return prevStreams;
    });
  }, []);

  const value = useMemo(
    () => ({
      remoteStreams,
      addRemoteStream,
      removeRemoteStream,
      removeAllRemoteStreams,
      setRemoteMuteState,
    }),
    [addRemoteStream, remoteStreams, removeAllRemoteStreams, removeRemoteStream, setRemoteMuteState]
  );

  return <RemoteStreamsContext.Provider value={value}>{children}</RemoteStreamsContext.Provider>;
};

export const useRemoteStreams = (): RemoteStreamsContextType => {
  const context = useContext(RemoteStreamsContext);
  if (!context) {
    /** @todo - Handle error */
    throw new Error('useRemoteStreams() hook must be used within a <RemoteStreamsProvider />.');
  }

  return context;
};
