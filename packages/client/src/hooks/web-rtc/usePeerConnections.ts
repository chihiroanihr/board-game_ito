// usePeerConnections.js
import { useRef, useCallback } from 'react';

import { NamespaceEnum } from '@bgi/shared';

import { useSocket } from '@/hooks';
import { type PeerConnectionsDataType } from '../../enum';

const ICE_SERVER = {
  urls: 'stun:stun.l.google.com:19302', // Google's public STUN server // 'turn:your-turn-server-host:your-turn-server-port',
};
// "stun:stun2.l.google.com:19302"

const usePeerConnections = () => {
  const { socket } = useSocket();

  const peerConnections = useRef<PeerConnectionsDataType>({});

  /**
   * @function muteFromAllPeerConnections - Mutes or unmutes all peer connections
   * @param {PeerConnectionsDataType} peerConnections - The peer connections to mute or unmute
   * @param {MediaStream} audioStream - The audio stream to mute or unmute
   * @param {boolean} isMuted - Whether to mute or unmute
   * @returns {void}
   */
  const muteFromAllPeerConnections = useCallback(
    (peerConnections: PeerConnectionsDataType, audioStream: MediaStream, isMuted: boolean) => {
      if (audioStream && peerConnections) {
        // Iterate and toggle mute state of each peer connection
        Object.keys(peerConnections).forEach((strPlayerId: string) => {
          const peerConnection = peerConnections[strPlayerId];
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

  /**
   * @function closePeerConnection - Closes an existing peer connection
   * @param {string} strPlayerId - The stringified player ID of the peer connection to close
   * @returns {void}
   */
  const closePeerConnection = useCallback((strPlayerId: string) => {
    const peerConnection = peerConnections.current[strPlayerId];
    if (peerConnection) {
      // Close the existing peer connection
      peerConnection.close();
      // Remove from the peerConnections list
      delete peerConnections.current[strPlayerId];
    }

    console.log('Peer connection closed.');
  }, []);

  /**
   * @function closeAllPeerConnections - Closes all existing peer connections
   * @param {PeerConnectionsDataType} peerConnections - The peer connections to close
   * @returns {void}
   */
  const closeAllPeerConnections = useCallback((peerConnections: PeerConnectionsDataType) => {
    Object.values(peerConnections).forEach((peerConnection) => {
      if (peerConnection) {
        (peerConnection as RTCPeerConnection).close();
      }
    });
    peerConnections = {};

    console.log('All peer connections closed.');
  }, []);

  /**
   * @function restartPeerConnection - Restarts an existing peer connection
   * @param socketId - The socket ID of the peer connection to restart
   * @returns {void}
   */
  const restartPeerConnection = (strPlayerId: string) => {
    console.log(strPlayerId);
  };

  /**
   * @function createNewPeerConnection - Creates a new peer connection
   * @param {MediaStream} localMediaStream - The local media stream
   * @returns {RTCPeerConnection} - The new peer connection
   */
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

  /**
   * @function createOfferAndSendSignal - Creates an offer and sends it to a peer
   * @param {string} toSocketId - The socket ID of the receiver
   * @returns {void}
   */
  const createOfferAndSendSignal = useCallback(
    async ({
      peerConnection,
      toSocketId,
    }: {
      peerConnection: RTCPeerConnection;
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
          toSocketId,
        });
      } catch (error) {
        console.error(
          `[!] Failed to process offer to user with socket ID: ${toSocketId}: \n
          Error: ${error}`
        );
      }
    },
    [socket]
  );

  /**
   * @function createAnswerAndSendSignal - Creates an answer and sends it to a peer
   * @param {string} toSocketId - The socket ID of the receiver
   * @returns {void}
   */
  const createAnswerAndSendSignal = useCallback(
    async ({
      peerConnection,
      signal,
      toSocketId,
    }: {
      peerConnection: RTCPeerConnection;
      signal: RTCSessionDescriptionInit;
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
          toSocketId,
        }); // Send answer and my user ID to the *sender's socket*
      } catch (error) {
        console.error(
          `[!] Failed to process answer to user with socket ID: ${toSocketId}. \n
          Error: ${error}`
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
