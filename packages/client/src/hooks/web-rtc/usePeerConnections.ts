// usePeerConnections.js
import { useRef, useCallback } from 'react';

import { NamespaceEnum } from '@bgi/shared';

import { useSocket } from '@/hooks';

const ICE_SERVER = {
  urls: 'stun:stun.l.google.com:19302', // Google's public STUN server // 'turn:your-turn-server-host:your-turn-server-port',
};
// "stun:stun2.l.google.com:19302"

interface PeerConnectionsData {
  [key: string]: RTCPeerConnection | undefined;
}

const usePeerConnections = () => {
  const { socket } = useSocket();

  const peerConnections = useRef<PeerConnectionsData>({});

  const muteFromAllPeerConnections = useCallback(
    (peerConnections: PeerConnectionsData, audioStream: MediaStream, isMuted: boolean) => {
      if (audioStream && peerConnections) {
        // Iterate and toggle mute state of each peer connection
        Object.keys(peerConnections).forEach((socketId: string) => {
          const peerConnection = peerConnections[socketId];
          if (peerConnection) {
            // Access senders
            const senders = peerConnection.getSenders();
            // Change parameters in all senders
            senders.forEach(async (sender: RTCRtpSender) => {
              const params = sender.getParameters();
              if (params.encodings[0]) {
                params.encodings[0].active = !isMuted;
                await sender.setParameters(params);
              }
            });
          }
        });
      }
    },
    []
  );

  const closePeerConnection = useCallback((socketId: string) => {
    const peerConnection = peerConnections.current[socketId];
    if (peerConnection) {
      // Close the existing peer connection
      peerConnection.close();
      // Remove from the peerConnections list
      delete peerConnections.current[socketId];
    }

    console.log('Peer connection closed.');
  }, []);

  const closeAllPeerConnections = useCallback((peerConnections: PeerConnectionsData) => {
    Object.values(peerConnections).forEach((peerConnection) => peerConnection?.close());
    peerConnections = {};

    console.log('All peer connections closed.');
  }, []);

  const restartPeerConnection = (socketId: string) => {
    console.log(socketId);
  };

  const createNewPeerConnection = useCallback((localMediaStream: MediaStream) => {
    // Initializes a new peer connection with ICE server configuration
    const peerConnection = new RTCPeerConnection({
      iceServers: [ICE_SERVER],
    });

    // Add local stream to peer connection
    localMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
      peerConnection.addTrack(track, localMediaStream);
    }); // peerConnection.addTrack(localMediaStream.getAudioTracks()[0]!, localMediaStream);

    return peerConnection;
  }, []);

  const createOfferAndSendSignal = useCallback(
    async ({
      peerConnection,
      fromSocketId,
      toSocketId,
    }: {
      peerConnection: RTCPeerConnection;
      fromSocketId: string;
      toSocketId: string;
    }) => {
      try {
        // Create an offer
        const offer = await peerConnection.createOffer();
        // Set own local description
        await peerConnection.setLocalDescription(offer);
        // Send an offer
        socket.emit(NamespaceEnum.SEND_VOICE_OFFER, {
          signal: offer,
          fromSocketId,
          toSocketId,
        });
      } catch (error) {
        console.error(
          `[!] Failed to process offer from user ${fromSocketId} to user ${toSocketId}: ${error}`
        );
      }
    },
    [socket]
  );

  const createAnswerAndSendSignal = useCallback(
    async ({
      peerConnection,
      signal,
      fromSocketId,
      toSocketId,
    }: {
      peerConnection: RTCPeerConnection;
      signal: RTCSessionDescriptionInit;
      fromSocketId: string;
      toSocketId: string;
    }) => {
      try {
        // Set sender's signal to remote description
        await peerConnection.setRemoteDescription(signal);
        // Create an answer
        const answer = await peerConnection.createAnswer();
        // Set own local description
        await peerConnection.setLocalDescription(answer);
        // Send an answer
        socket.emit(NamespaceEnum.SEND_VOICE_ANSWER, {
          signal: answer,
          fromSocketId,
          toSocketId,
        }); // Send answer and my user ID to the *sender's socket*
      } catch (error) {
        console.error(
          `[!] Failed to process answer from user ${fromSocketId} to user ${toSocketId}: ${error}`
        );
      }
    },
    [socket]
  );

  return {
    peerConnections,
    muteFromAllPeerConnections,
    closePeerConnection,
    closeAllPeerConnections,
    restartPeerConnection,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
  };
};

export default usePeerConnections;