import { useRef, useCallback } from 'react';

import { NamespaceEnum } from '@bgi/shared';

import { useSocket, useRemoteStreams } from '@/hooks';

// Multiple STUN servers and a TURN server to increase the chances of successful connection:
const ICE_SERVERS = [
  // Google's public STUN server
  { urls: 'stun:stun.l.google.com:19302' },
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
 * @returns {Record<string, RTCPeerConnection>} - An object containing the peer connections.
 * @example const { peerConnections } = usePeerConnections();
 */
const usePeerConnections = () => {
  // Calling context hook inside this custom "usePeerConnections" hook
  const { addRemoteStream, removeRemoteStream, removeAllRemoteStreams, setRemoteMuteState } =
    useRemoteStreams();

  const { socket } = useSocket();

  const peerConnections = useRef<Record<string, RTCPeerConnection>>({});

  const handleError = (msg: string, error: unknown) => {
    console.error(`[!] ${msg}: `, error);
  };

  /**
   * @function closePeerConnection - Closes an existing peer connection
   * @param {string} strPlayerId - The stringified player ID of the peer connection to close
   * @returns {void}
   */
  const closePeerConnection = useCallback(
    (strPlayerId: string) => {
      // Close the existing peer connection
      const peerConnection = peerConnections.current[strPlayerId];
      if (peerConnection) {
        peerConnection.close();
      }
      // Remove from the peerConnections list
      delete peerConnections.current[strPlayerId];
      // Remove the peer from remote streams
      removeRemoteStream(strPlayerId);

      console.log('Peer connection closed.');
    },
    [removeRemoteStream]
  );

  /**
   * @function closeAllPeerConnections - Closes all existing peer connections
   * @returns {void}
   */
  const closeAllPeerConnections = useCallback(() => {
    // Close all peer connections by iterating the peerConnections list
    Object.values(peerConnections.current).forEach((peerConnection) => {
      peerConnection.close();
    });
    // Initialize peerConnections list to an empty object
    peerConnections.current = {};
    // Remove all peers from remote streams
    removeAllRemoteStreams();

    console.log('All peer connections closed.');
  }, [removeAllRemoteStreams]);

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
        handleError(`Failed to create/send offer to user with socket ID ${toSocketId}`, error);
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
        handleError(`Failed to create/send answer to user with socket ID ${toSocketId}`, error);
      }
    },
    [socket]
  );

  /**
   * @function setRemotePeerAnswer - Sets the remote peer's answer
   * @param {RTCSessionDescriptionInit} signal - The signal from the peer
   * @param {string} fromStrUserId - The stringified user ID of the sender
   * @returns {void}
   */
  const setRemotePeerAnswer = useCallback(
    async (signal: RTCSessionDescriptionInit, fromStrUserId: string) => {
      try {
        const peerConnection = peerConnections.current[fromStrUserId];
        // If answer is back from the voice exchanged user, set sender's signal to remote description
        if (peerConnection) await peerConnection.setRemoteDescription(signal);
        // Answer came from nowhere (player ID does not exist in peer connections)
        else throw new Error(`Incoming answer error from User ID ${fromStrUserId}. Who is this?`);
      } catch (error) {
        handleError('Failed to set remote description', error);
      }
    },
    []
  );

  /**
   * @function setRemotePeerCandidate - Sets the remote peer's candidate
   * @param {RTCIceCandidate} candidate - The ICE candidate
   * @param {string} fromStrUserId - The stringified user ID of the sender
   * @returns {void}
   */
  const setRemotePeerCandidate = useCallback(
    async (candidate: RTCIceCandidate, fromStrUserId: string) => {
      try {
        const peerConnection = peerConnections.current[fromStrUserId];
        // If sender exists, add sender's candidate to remote description
        if (peerConnection) await peerConnection.addIceCandidate(candidate);
        // Answer came from nowhere (player ID does not exist in peer connections)
        else
          throw new Error(
            `Incoming ice candidate error for User ID ${fromStrUserId}. Who is this?`
          );
      } catch (error) {
        handleError('Failed to set remote candidate', error);
      }
    },
    []
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

      // Add local audio stream to newly created peer
      localMediaStream.getTracks().forEach((track: MediaStreamTrack) => {
        newPeerConnection.addTrack(track, localMediaStream);
      });

      // Handle received ICE candidates (Trickle ICE method)
      /**
       * Trickle Ice:
       * - Exchanging candidate information each time we discover it
       * - Could potentially shorten the time until a P2P connection is established
       */
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
          console.log('[!] Connection failed. Trying ICE restart...');
          try {
            newPeerConnection.restartIce();
          } catch (error) {
            console.error('[!] ICE restart failed. Recreating the peer connection...');
            closePeerConnection(remoteStrUserId);
            createNewPeerConnection(localMediaStream, remoteSocketId, remoteStrUserId);
          }
        }
      };

      // Handle ICE connection state change
      newPeerConnection.oniceconnectionstatechange = () => {
        console.log(`[*] Ice connection state change: ${newPeerConnection.iceConnectionState}`);
      };

      // Handle renegotiation: updating an existing peer connection to accommodate changes (i.e., adding or removing media tracks)
      // newPeerConnection.onnegotiationneeded = async () => {
      //   try {
      //     await createOfferAndSendSignal(newPeerConnection, remoteSocketId);
      //   } catch (error) {
      //     console.error('[!] Error during renegotiation: ', error);
      //   }
      // };

      // Handle received remote audio streams
      newPeerConnection.ontrack = (event: RTCTrackEvent) => {
        console.log(`[+] Received remote stream: ${event.streams[0]?.id}`);

        // Get remote stream
        const remoteStream = event.streams[0];
        if (remoteStream) {
          // Store remote stream received from the peer into remoteStreams list
          addRemoteStream(remoteStrUserId, remoteStream);
          // Play remote streams
          const remoteAudio = new Audio();
          remoteAudio.srcObject = remoteStream;
          remoteAudio.play();
        } else {
          console.error('No remote stream available.');
        }
      };

      // Create a data channel for mute state
      newPeerConnection.createDataChannel('mute-state');
      // Handle data channel events
      newPeerConnection.ondatachannel = (event: RTCDataChannelEvent) => {
        console.log('[+] Received data channel: ', event.channel.label);
        // Handle data channel open event
        event.channel.onopen = () => console.log('[*] Data channel is open for: ', remoteStrUserId);
        // Handle incoming mute state messages from the peer
        event.channel.onmessage = (event) => {
          console.log('[+] Received mute state: ', event.data);
          // Extract the peer's mute state
          const { muted } = JSON.parse(event.data);
          // Update the remote mute state for this peer
          setRemoteMuteState(remoteStrUserId, muted);
        };
        // Handle data channel close event
        event.channel.onclose = () => console.log('[*] Data channel closed for: ', remoteStrUserId);
      };

      // Store new player into peerConnections object
      peerConnections.current[remoteStrUserId] = newPeerConnection;

      return newPeerConnection;
    },
    [addRemoteStream, closePeerConnection, setRemoteMuteState, socket]
  );

  return {
    peerConnections,
    closePeerConnection,
    closeAllPeerConnections,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
    setRemotePeerAnswer,
    setRemotePeerCandidate,
  };
};

export default usePeerConnections;
