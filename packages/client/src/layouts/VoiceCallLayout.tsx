import React, { useEffect, useRef, useCallback } from 'react';

import {
  type MicReadyResponse,
  type PlayerOutResponse,
  type PlayerDisconnectedResponse,
  type PlayerMicReadyResponse,
  type ReceiveIceCandidateResponse,
  type ReceiveVoiceOfferResponse,
  type ReceiveVoiceAnswerResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { VoiceButton } from '@/components';
import {
  useSocket,
  useAuth,
  useLocalMediaStream,
  usePeerConnections,
  usePlayerStatus,
  useVoiceCall,
} from '@/hooks';
import { outputServerError } from '@/utils';

const VoiceCallLayout = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { localMediaStream, toggleMuteMediaStream, isMuted } = useLocalMediaStream();
  const {
    peerConnections,
    muteFromAllPeerConnections,
    closePeerConnection,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
  } = usePeerConnections();

  const localAudioRef = useRef<HTMLAudioElement>(null);

  const mySocketId = socket.id;

  // When mute button is toggled
  useEffect(() => {
    muteFromAllPeerConnections(peerConnections.current, localMediaStream, isMuted);
  }, [isMuted, localMediaStream, muteFromAllPeerConnections, peerConnections]);

  // When your local stream (localMediaStream) is ready
  useEffect(() => {
    if (localAudioRef.current && localMediaStream) {
      localAudioRef.current.srcObject = localMediaStream;

      /** @todo: Move to usePreFormSubmission */
      socket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
        if (error) console.error(error);
      });
    }
  }, [localMediaStream, socket]);

  /**
   * Callbacks for player connection status hook
   */
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
  const handlePlayerLeft = ({ socketId, user, room }: PlayerOutResponse) => {
    closePeerConnection(socketId); // Close peer connection for player just disconnected
  };
  const handlePlayerDisconnected = ({ socketId, user }: PlayerDisconnectedResponse) => {
    closePeerConnection(socketId); // Close peer connection for player just disconnected
  };
  /**
   * Player connection status hook
   */
  usePlayerStatus({
    onPlayerLeftCallback: handlePlayerLeft,
    onPlayerDisconnectedCallback: handlePlayerDisconnected,
    onPlayerMicReadyCallback: handlePlayerMicReady,
  });

  const handleEventConnectionStateChange = useCallback(
    (peerConnection: RTCPeerConnection) => {
      switch (peerConnection.connectionState) {
        case 'connected':
          // Mute all connections by default
          muteFromAllPeerConnections(peerConnections.current, localMediaStream, isMuted);
          console.log('[*] Connection is now connected!');
          break;
        case 'connecting':
          console.log('[*] Connection is now connecting...');
          break;
        case 'disconnected':
          console.log('[*] Connection is now disconnected!');
          break;
        case 'failed':
          console.log('[*] Connection attempt has failed!');
          break;
        case 'closed':
          console.log('[*] Connection is now closed!');
          break;
        default:
          // Handle other states if necessary
          console.log('[*] Connection state changed:', peerConnection.connectionState);
      }
    },
    [isMuted, localMediaStream, muteFromAllPeerConnections, peerConnections]
  );

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

  const handleEventTrackRemoteStreams = useCallback((event: RTCTrackEvent) => {
    console.log(`--------------- Received remote stream ---------------`);
    console.log(event.streams[0]);

    // Get remote stream
    const remoteStream = event.streams[0];
    if (remoteStream) {
      // Log remote stream properties for debugging
      console.log(`Remote stream id:`, remoteStream.id);
      console.log(`Remote stream active tracks:`, remoteStream.getAudioTracks());

      const remoteAudio = new Audio();
      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();

      // if (remoteAudioRef.current) remoteAudioRef.current.srcObject = remoteStream;
    }
  }, []);

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
          socket.emit(NamespaceEnum.SEND_ICE_CANDIDATE, {
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
   * Callbacks for voice call hooks
   */
  const handleIceCandidate = ({ candidate, fromSocketId }: ReceiveIceCandidateResponse) => {
    if (peerConnections.current[fromSocketId]) {
      peerConnections.current[fromSocketId]!.addIceCandidate(candidate); // Add sender's candidate to remote description
    } else {
      console.error(`[!] Incoming ice candidate error for ${fromSocketId}.`);
    }
  };
  const handleVoiceOffer = async ({ signal, fromSocketId }: ReceiveVoiceOfferResponse) => {
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
  };
  const handleVoiceAnswer = ({ signal, fromSocketId }: ReceiveVoiceAnswerResponse) => {
    // If answer is back from the ID stored
    if (peerConnections.current[fromSocketId]) {
      peerConnections.current[fromSocketId]!.setRemoteDescription(signal); // Set sender's signal to remote description
    }
    // Answer came from nowhere (user ID never stored)
    else {
      console.error(`[!] Incoming answer error from ${fromSocketId}. Who is this?`);
    }
  };
  /**
   * Voice call hook
   */
  useVoiceCall({
    onIceCandidateCallback: handleIceCandidate,
    onVoiceOfferCallback: handleVoiceOffer,
    onVoiceAnswerCallback: handleVoiceAnswer,
  });

  /** @LOG */
  //   if (!peerConnections.current) {
  //     console.log('No peer connections.');
  //   } else {
  //     console.log(peerConnections.current);
  //     for (const key of Object.keys(peerConnections.current)) {
  //       const peerConnection = peerConnections.current[key];
  //       if (peerConnection) {
  //         console.log(
  //           '[connection state]',
  //           peerConnection.connectionState,
  //           '\n',
  //           '[ice connection state]',
  //           peerConnection.iceConnectionState,
  //           '\n',
  //           '[ice gathering state]',
  //           peerConnection.iceGatheringState,
  //           '\n'
  //         );
  //       }
  //     }
  //   }

  return (
    <>
      <VoiceButton isMuted={isMuted} disabled={!localMediaStream} onClick={toggleMuteMediaStream} />
      {localMediaStream && <audio ref={localAudioRef} autoPlay muted />}
    </>
  );
};

export default VoiceCallLayout;
