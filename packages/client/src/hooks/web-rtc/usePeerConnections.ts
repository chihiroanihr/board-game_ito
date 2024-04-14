// usePeerConnections.js
import { useRef, useCallback } from 'react';

import { NamespaceEnum } from '@bgi/shared';

import { useSocket } from '@/hooks';

const ICE_SERVER = {
  urls: 'stun:stun.l.google.com:19302', // Google's public STUN server // 'turn:your-turn-server-host:your-turn-server-port',
};

const usePeerConnections = () => {
  const { socket } = useSocket();

  const peerConnections = useRef<{
    [key: string]: RTCPeerConnection | undefined;
  }>({});

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

  const closeAllPeerConnections = () => {
    Object.values(peerConnections.current).forEach((peerConnection) => peerConnection?.close());
    peerConnections.current = {};

    console.log('All peer connections closed.');
  };

  const restartPeerConnection = (playerId: string) => {
    console.log(playerId);
  };

  const createNewPeerConnection = useCallback((localMediaStream: MediaStream) => {
    // Initializes a new peer connection with ICE server configuration
    const peerConnection = new RTCPeerConnection({
      iceServers: [ICE_SERVER],
    });

    // Add local stream to peer connection
    peerConnection.addTrack(localMediaStream.getAudioTracks()[0]!, localMediaStream);
    //   localMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
    //     peerConnection.addTrack(track, localMediaStream);
    //   });

    return peerConnection;
  }, []);

  const createOfferAndSendSignal = useCallback(
    async ({ peerConnection, userId }: { peerConnection: RTCPeerConnection; userId: string }) => {
      try {
        // Create an offer
        const offer = await peerConnection.createOffer();
        // Set own local description
        await peerConnection.setLocalDescription(offer);
        // Send an offer
        socket.emit(NamespaceEnum.VOICE_OFFER, {
          userId: userId,
          signal: offer,
        });
      } catch (error) {
        console.error(`[!] Failed to process offer from user ${userId}: ${error}`);
      }
    },
    [socket]
  );

  const createAnswerAndSendSignal = useCallback(
    async ({
      peerConnection,
      signal,
      toSocketId,
      userId,
    }: {
      peerConnection: RTCPeerConnection;
      signal: RTCSessionDescriptionInit;
      toSocketId: string;
      userId: string;
    }) => {
      try {
        // Set sender's signal to remote description
        await peerConnection.setRemoteDescription(signal);
        // Create an answer
        const answer = await peerConnection.createAnswer();
        // Set own local description
        await peerConnection.setLocalDescription(answer);
        // Send an answer
        socket.emit(NamespaceEnum.VOICE_ANSWER, {
          toSocketId,
          userId,
          signal: answer,
        }); // Send answer and my user ID to the *sender's socket*
      } catch (error) {
        console.error(`[!] Failed to process answer from user ${userId}: ${error}`);
      }
    },
    [socket]
  );

  return {
    peerConnections,
    closePeerConnection,
    closeAllPeerConnections,
    restartPeerConnection,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
  };
};

export default usePeerConnections;
