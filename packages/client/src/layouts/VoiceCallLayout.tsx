import React, { useEffect, useRef, useCallback } from 'react';

import {
  type MicReadyResponse,
  type PlayerInResponse,
  type PlayerOutResponse,
  type PlayerDisconnectedResponse,
  type PlayerReconnectedResponse,
  type PlayerMicReadyResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { VoiceButton } from '@/components';
import {
  useSocket,
  useAuth,
  useRoom,
  useLocalMediaStream,
  usePeerConnections,
  usePlayerStatus,
} from '@/hooks';
import { outputServerError } from '@/utils';

const VoiceCallLayout = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { room } = useRoom();

  const { localMediaStream, closeMediaStream } = useLocalMediaStream();
  const {
    peerConnections,
    closePeerConnection,
    closeAllPeerConnections,
    restartPeerConnection,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
  } = usePeerConnections();

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  // const myUserId = user?._id.toString();
  const mySocketId = socket.id;

  //   useEffect(() => {
  //     return () => {
  //       console.log('[ME] closing all peer connections.');
  //       closeAllPeerConnections();
  //     };
  //   }, [closeAllPeerConnections]);

  useEffect(() => {
    if (localAudioRef.current && localMediaStream) {
      console.log('[ME] connected to media.');
      localAudioRef.current.srcObject = localMediaStream;

      /** @todo: Move to useAction */
      socket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
        if (error) console.error(error);
      });
    }
  }, [localMediaStream, mySocketId, socket]);

  const handlePlayerMicReady = async ({ socketId: playerSocketId }: PlayerMicReadyResponse) => {
    // Avoid duplicate creation due to multi-rendering
    if (!peerConnections.current[playerSocketId]) {
      console.log(`[SENDER] create and send new peer connection for ${playerSocketId}.`);
      // Create peer connection and assign
      const newPeerConnection = createNewPeerConnection(localMediaStream);
      // Store new player into peerConnections object
      peerConnections.current[playerSocketId] = newPeerConnection;
      // Create and send ICE candidate to new player
      setupPeerConnection({
        peerConnection: newPeerConnection,
        fromSocketId: mySocketId,
        toSocketId: playerSocketId,
      });
      // Create and send offer
      await createOfferAndSendSignal({
        peerConnection: newPeerConnection,
        fromSocketId: mySocketId,
        toSocketId: playerSocketId,
      });
    }
  };

  const handlePlayerJoined = async ({ socketId }: PlayerInResponse) => {};

  const handlePlayerLeft = ({ socketId, user, room }: PlayerOutResponse) => {
    closePeerConnection(socketId); // Close peer connection for player just disconnected
  };
  const handlePlayerDisconnected = ({ socketId, user }: PlayerDisconnectedResponse) => {
    closePeerConnection(socketId); // Close peer connection for player just disconnected
  };
  const handlePlayerReconnected = ({ socketId, user }: PlayerReconnectedResponse) => {
    restartPeerConnection(socketId);
  };

  // Player connection status hook
  usePlayerStatus({
    onPlayerJoinedCallback: handlePlayerJoined,
    onPlayerLeftCallback: handlePlayerLeft,
    onPlayerDisconnectedCallback: handlePlayerDisconnected,
    onPlayerReconnectedCallback: handlePlayerReconnected,
    onPlayerMicReadyCallback: handlePlayerMicReady,
  });

  const handleEventConnectionStateChange = useCallback((peerConnection: RTCPeerConnection) => {
    switch (peerConnection.connectionState) {
      case 'connected':
        // Connection is established
        console.log('[*] Connection is now connected!');
        // Perform actions when connection is established
        break;
      case 'connecting':
        // Connection is in the process of being established
        console.log('[*] Connection is now connecting...');
        // Perform actions while connection is being established
        break;
      case 'disconnected':
        // Connection is disconnected
        console.log('[*] Connection is now disconnected!');
        break;
      case 'failed':
        // Connection attempt has failed
        console.log('[*] Connection attempt has failed!');
        break;
      case 'closed':
        // Connection is closed
        console.log('[*] Connection is now closed!');
        // Perform actions when connection is closed
        break;
      default:
        // Handle other states if necessary
        console.log('[*] Connection state changed:', peerConnection.connectionState);
    }
  }, []);

  const handleEventIceConnectionStateChange = useCallback((peerConnection: RTCPeerConnection) => {
    switch (peerConnection.iceConnectionState) {
      case 'checking':
        // Connection is in the process of being established
        console.log('[*] ICE connection is now checking...');
        // Perform actions while connection is being established
        break;
      case 'connected':
        // Connection is established
        console.log('[*] ICE connection is now connected!');
        // Perform actions when connection is established
        break;
      case 'completed':
        // Connection is completed
        console.log('[*] ICE connection is now completed!');
        break;
      default:
        // Handle other states if necessary
        console.log('[*] ICE connection state changed:', peerConnection.iceConnectionState);
    }
  }, []);

  const handleEventTrackRemoteStreams = useCallback(
    (event: RTCTrackEvent) => {
      console.log(`--------------- My media stream ---------------`);
      console.log(localMediaStream);
      console.log(`--------------- Received remote stream ---------------`);
      console.log(event.streams[0]);

      // Get remote stream
      const remoteStream = event.streams[0];
      if (remoteStream) {
        // Log remote stream properties for debugging
        console.log(`Remote stream id:`, remoteStream.id);
        console.log(`Remote stream active tracks:`, remoteStream.getAudioTracks());

        // const audio = new Audio();
        // audio.srcObject = remoteStream;
        // audio.play();

        if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
      }
    },
    [localMediaStream]
  );

  const setupPeerConnection: ({
    peerConnection,
    fromSocketId,
    toSocketId,
  }: {
    peerConnection: RTCPeerConnection;
    fromSocketId: string;
    toSocketId: string;
  }) => void = useCallback(
    ({ peerConnection, fromSocketId, toSocketId }) => {
      console.log('[SENDER] setting up peer connection.');

      // Handle remote audio stream
      peerConnection.ontrack = (event) => handleEventTrackRemoteStreams(event);

      // Handle peer connection state change
      peerConnection.onconnectionstatechange = () =>
        handleEventConnectionStateChange(peerConnection);
      peerConnection.oniceconnectionstatechange = () =>
        handleEventIceConnectionStateChange(peerConnection);

      // Handle ICE candidates (send ice candidate)
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(NamespaceEnum.VOICE_CANDIDATE, {
            candidate: event.candidate,
            fromSocketId,
            toSocketId,
          });
        }
      };
    },
    [
      handleEventConnectionStateChange,
      handleEventIceConnectionStateChange,
      handleEventTrackRemoteStreams,
      socket,
    ]
  );

  /**
   * Handle incoming ice candidate
   */
  useEffect(() => {
    async function onIceCandidate({
      candidate,
      fromSocketId,
    }: {
      candidate: RTCIceCandidate;
      fromSocketId: string;
    }) {
      console.log('[RECEIVER] ice candidate received.');

      if (peerConnections.current[fromSocketId]) {
        peerConnections.current[fromSocketId]!.addIceCandidate(candidate); // Add sender's candidate to remote description
      } else {
        console.error(`[!] Incoming ice candidate error for ${fromSocketId}.`);
      }
    }

    socket.on(NamespaceEnum.VOICE_CANDIDATE, onIceCandidate);
    return () => socket.off(NamespaceEnum.VOICE_CANDIDATE, onIceCandidate);
  }, [peerConnections, socket]);

  /**
   * Handle incoming offer
   */
  useEffect(() => {
    async function onVoiceOffer({
      signal,
      fromSocketId,
    }: {
      signal: RTCSessionDescriptionInit;
      fromSocketId: string;
    }) {
      console.log('[RECEIVER] offer received.');

      // Search sender's ID in peer connection
      let peerConnection = peerConnections.current[fromSocketId];

      // If sender does not exist: new sender's info arrived
      if (!peerConnection) {
        // Create new peer connection for the offer
        peerConnection = createNewPeerConnection(localMediaStream)!;
        // Create and send ICE candidate
        setupPeerConnection({
          peerConnection,
          fromSocketId: mySocketId,
          toSocketId: fromSocketId,
        });
        // Add sender to the list of peers
        peerConnections.current[fromSocketId] = peerConnection!;
      }

      // Proceed with creating and sending answer
      await createAnswerAndSendSignal({
        peerConnection,
        signal,
        fromSocketId: mySocketId,
        toSocketId: fromSocketId,
      });
    }

    socket.on(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
    return () => socket.off(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
  }, [
    createAnswerAndSendSignal,
    createNewPeerConnection,
    localMediaStream,
    mySocketId,
    peerConnections,
    setupPeerConnection,
    socket,
  ]);

  /**
   * Handle incoming answer
   */
  useEffect(() => {
    async function onVoiceAnswer({
      signal,
      fromSocketId,
    }: {
      signal: RTCSessionDescriptionInit;
      fromSocketId: string;
    }) {
      console.log('[SENDER] answer received.');

      // If answer is back from the ID stored
      if (peerConnections.current[fromSocketId]) {
        peerConnections.current[fromSocketId]!.setRemoteDescription(signal); // Set sender's signal to remote description
      }
      // Answer came from nowhere (user ID never stored)
      else {
        console.error(`[!] Incoming answer error from ${fromSocketId}. Who is this?`);
      }
    }

    socket.on(NamespaceEnum.VOICE_ANSWER, onVoiceAnswer);
    return () => socket.off(NamespaceEnum.VOICE_ANSWER, onVoiceAnswer);
  }, [peerConnections, socket]);

  /** @LOG */
  if (!peerConnections.current) {
    console.log('No peer connections.');
  } else {
    console.log(peerConnections.current);
    for (const key of Object.keys(peerConnections.current)) {
      const peerConnection = peerConnections.current[key];
      if (peerConnection) {
        console.log(
          '[connection state]',
          peerConnection.connectionState,
          '\n',
          '[ice connection state]',
          peerConnection.iceConnectionState,
          '\n',
          '[ice gathering state]',
          peerConnection.iceGatheringState,
          '\n'
        );
      }
    }
  }

  return (
    <>
      <VoiceButton audioStream={localMediaStream} peerConnections={peerConnections.current} />
      {localMediaStream && <audio ref={localAudioRef} autoPlay controls muted />}
      {<audio ref={remoteAudioRef} autoPlay controls />}

      {/* {Object.entries(audioRefs.remotes.current).map(([userId, stream]) => (
    <audio key={userId} ref={audioRefs.remotes.current[userId]} autoPlay />
  ))} */}
    </>
  );
};

export default VoiceCallLayout;
