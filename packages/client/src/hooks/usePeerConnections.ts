// usePeerConnections.js
import { useRef, useCallback } from 'react';

import { useLocalMediaStream } from '@/hooks';

const ICE_SERVER = {
  urls: 'stun:stun.l.google.com:19302', // Google's public STUN server // 'turn:your-turn-server-host:your-turn-server-port',
};

const usePeerConnections = () => {
  const peerConnections = useRef<{
    [key: string]: RTCPeerConnection;
  }>({});

  const { localMediaStream } = useLocalMediaStream();

  const closePeerConnection = (playerId: string) => {
    const peerConnection = peerConnections.current[playerId];
    if (peerConnection) {
      // Close the existing peer connection
      peerConnection.close();
      // Remove from the peerConnections list
      delete peerConnections.current[playerId];
      //   const updatedPeerConnections = { ...peerConnections.current };
      //   delete updatedPeerConnections[playerId];
      //   peerConnections.current = updatedPeerConnections;
    }

    console.log('Peer connection closed.');
  };

  /** @todo - only close when player leaves (move this out to parent component) */
  //   const closeAllPeerConnections = () => {
  //     // Close all peer connections
  //     Object.values(peerConnections.current).forEach((peerConnection) => peerConnection.close());
  //     // After closing all peer connections, you can clear the state
  //     peerConnections.current = {};

  //     console.log('Successfully closed all peer connections.');
  //   };

  const restartPeerConnection = (playerId: string) => {
    console.log(playerId);
  };

  const createNewPeerConnection = useCallback(() => {
    // Initializes a new peer connection with ICE server configuration
    const peerConnection = new RTCPeerConnection({
      iceServers: [ICE_SERVER],
    });

    // Add local stream to peer connection
    if (localMediaStream) {
      // peerConnection.addTrack(localMediaStream.getAudioTracks()[0]!, localMediaStream);
      localMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
        peerConnection.addTrack(track, localMediaStream);
      });
    }

    return peerConnection;
  }, [localMediaStream]);

  return { peerConnections, closePeerConnection, restartPeerConnection, createNewPeerConnection };
};

export default usePeerConnections;
