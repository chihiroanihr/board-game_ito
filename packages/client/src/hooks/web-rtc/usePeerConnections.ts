// usePeerConnections.js
import { useRef, useCallback } from 'react';

import { MicReadyResponse, NamespaceEnum } from '@bgi/shared';

import { useSocket } from '@/hooks';

// Multiple STUN servers and a TURN server to increase the chances of successful connection:
const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' }, // Google's public STUN server // 'turn:your-turn-server-host:your-turn-server-port',
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
  { urls: 'stun:stun3.l.google.com:19302' },
  { urls: 'stun:stun4.l.google.com:19302' },
  // {
  //   urls: 'turn:your-turn-server.com:3478',
  //   username: 'your-username',
  //   credential: 'your-password',
  // }
];

/**
 * @function usePeerConnections - A hook that handles the creation and management of RTCPeerConnections.
 * @returns {Object} An object containing functions to manage peer connections
 * @returns {Function} muteFromAllPeerConnections - A function to mute or unmute all peer connections
 * @returns {Function} closePeerConnection - A function to close a peer connection
 * @returns {Function} createNewPeerConnection - A function to create a new peer connection
 * @returns {Function} createOfferAndSendSignal - A function to create an offer and send it to a peer
 * @returns {Function} createAnswerAndSendSignal - A function to create an answer and send it to a peer
 * @returns {Record<string, RTCPeerConnection>} peerConnections - An object containing peer connections
 * @example
 * const { muteFromAllPeerConnections, closePeerConnection, createNewPeerConnection, createOfferAndSendSignal, createAnswerAndSendSignal, peerConnections } = usePeerConnections();
 */
const usePeerConnections = () => {
  const { socket } = useSocket();

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  /**
   * @function muteFromAllPeerConnections - Mutes or unmutes all peer connections
   * @param {Record<string, RTCPeerConnection>} peerConnections - The peer connections to mute or unmute
   * @param {MediaStream} audioStream - The audio stream to mute or unmute
   * @param {boolean} isMuted - Whether to mute or unmute
   * @returns {void}
   */
  const muteFromAllPeerConnections = useCallback(
    (
      peerConnections: Record<string, RTCPeerConnection>,
      audioStream: MediaStream,
      isMuted: boolean
    ) => {
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
   * @returns {void}
   */
  const closeAllPeerConnections = useCallback(() => {
    // Close all peer connections by iterating the peerConnections list
    Object.values(peerConnections.current).forEach((connection) => {
      connection?.close();
    });
    // Initialize peerConnections list to an empty object
    peerConnections.current = {};

    console.log('All peer connections closed.');
  }, []);

  /**
   * @function restartPeerConnection - Restarts a peer connection
   * @param {MediaStream} localMediaStream - The local media stream
   * @param {string} remoteStrUserId - The remote user ID
   * @returns {void}
   */
  const restartPeerConnection = useCallback(
    (localMediaStream: MediaStream, remoteStrUserId: string) => {
      // Close existing connection
      if (peerConnections.current[remoteStrUserId]) {
        peerConnections.current[remoteStrUserId].close();
      }

      // Initiate new connection
      if (localMediaStream) {
        socket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
          if (error) console.error(error);
        });
      }
    },
    [socket]
  );

  /**
   * @function createNewPeerConnection - Creates a new peer connection
   * @param {MediaStream} localMediaStream - The local media stream
   * @param {string} remoteSocketId - The remote socket ID
   * @param {string} remoteStrUserId - The remote user ID
   * @returns {RTCPeerConnection} The newly created peer connection
   */
  const createNewPeerConnection = useCallback(
    (localMediaStream: MediaStream, remoteSocketId: string, remoteStrUserId: string) => {
      // Initializes a new peer connection with ICE server configuration
      const newPeerConnection = new RTCPeerConnection({
        iceServers: ICE_SERVERS,
        iceCandidatePoolSize: 10, // To gather ICE candidates in advance, which can speed up the connection process.
      });

      // Add local stream to peer connection
      localMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
        newPeerConnection.addTrack(track, localMediaStream);
      });

      // Handle ICE candidates (send ice candidate)
      newPeerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          socket.emit(NamespaceEnum.SEND_ICE_CANDIDATE, {
            candidate: event.candidate,
            toSocketId: remoteSocketId,
          });
        }
      };

      // Handle peer connection state change
      newPeerConnection.onconnectionstatechange = () => {
        console.log(`[*] Connection state change: ${newPeerConnection.connectionState}`);
        if (newPeerConnection.connectionState === 'failed') {
          newPeerConnection.restartIce();
        }
      };

      // Handle ICE connection state change
      newPeerConnection.oniceconnectionstatechange = () => {
        console.log(`[*] Ice connection state change: ${newPeerConnection.iceConnectionState}`);
        // if (newPeerConnection.connectionState === 'connected') {
        //   // Mute all connections by default
        //   muteFromAllPeerConnections(peerConnections.current, localMediaStream, isMuted);
        // }
        // if (newPeerConnection.connectionState === 'failed') {
        //   restartPeerConnection(localMediaStream, remoteStrUserId);
        // }
      };

      // Handle remote audio stream
      newPeerConnection.ontrack = (event: RTCTrackEvent) => {
        console.log(`[+] Received remote stream: ${event.streams[0]?.id}`);

        // Get remote stream
        const remoteStream = event.streams[0];
        if (remoteStream) {
          // Log remote stream properties for debugging
          // console.log(`Remote stream id:`, remoteStream.id);
          // console.log(`Remote stream active tracks:`, remoteStream.getTracks());

          const remoteAudio = new Audio();
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play();
        }
      };

      // Store new player into peerConnections object
      peerConnections.current[remoteStrUserId] = newPeerConnection;

      return newPeerConnection;
    },
    [socket]
  );

  /**
   * @function createOfferAndSendSignal - Creates an offer and sends it to a peer
   * @param {RTCPeerConnection} peerConnection - The peer connection
   * @param {string} toSocketId - The socket ID of the receiver
   * @returns {void}
   */
  const createOfferAndSendSignal = useCallback(
    async (peerConnection: RTCPeerConnection, toSocketId: string) => {
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
          `[!] Failed to create and send offer to user with socket ID: ${toSocketId}: \n
          Error: ${error}`
        );
      }
    },
    [socket]
  );

  /**
   * @function createAnswerAndSendSignal - Creates an answer and sends it to a peer
   * @param {RTCPeerConnection} peerConnection - The peer connection
   * @param {RTCSessionDescriptionInit} signal - The signal from the peer
   * @param {string} toSocketId - The socket ID of the receiver
   * @returns {void}
   */
  const createAnswerAndSendSignal = useCallback(
    async (
      peerConnection: RTCPeerConnection,
      signal: RTCSessionDescriptionInit,
      toSocketId: string
    ) => {
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
          `[!] Failed to create and send answer to user with socket ID: ${toSocketId}. \n
           Error: ${error}`
        );
      }
    },
    [socket]
  );

  return {
    peerConnections,
    closePeerConnection,
    closeAllPeerConnections,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
  };
};

export default usePeerConnections;
