import React, { useEffect, useRef, useCallback } from 'react';
import { ObjectId } from 'mongodb';

import { type User, NamespaceEnum } from '@bgi/shared';

import { VoiceButton } from '@/components';
import {
  useSocket,
  useAuth,
  useRoom,
  useLocalMediaStream,
  // usePeerConnections,
  usePlayerConnectionStatus,
} from '@/hooks';
import usePeerConnections from '../hooks/usePeerConnections.js';
import { outputServerError } from '@/utils';

const VoiceCallLayout = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { room } = useRoom();

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);

  const myUserId = user?._id.toString();

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

  const handlePlayerDisconnected = (player: User) => {
    closePeerConnection(player._id.toString()); // Close peer connection for player just disconnected
  };

  const handlePlayerReconnected = (player: User) => {
    restartPeerConnection(player._id.toString());
  };

  // Player connection status hook
  usePlayerConnectionStatus({
    onPlayerDisconnectedCallback: handlePlayerDisconnected,
    onPlayerReconnectedCallback: handlePlayerReconnected,
  });

  useEffect(() => {
    if (localAudioRef.current && localMediaStream) {
      localAudioRef.current.srcObject = localMediaStream;
    }
  }, [localMediaStream]);

  // useEffect(() => {
  //   closeAllPeerConnections();
  // }, [closeAllPeerConnections]);

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
    toSocketId,
  }: {
    peerConnection: RTCPeerConnection;
    toSocketId?: string;
  }) => void = useCallback(
    ({ peerConnection, toSocketId }) => {
      console.log('iceiceiceice');
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
            toSocketId, // If sending to specific socket ID
            userId: user._id.toString(),
            candidate: event.candidate,
          });
        }
      };
    },
    [
      handleEventConnectionStateChange,
      handleEventIceConnectionStateChange,
      handleEventTrackRemoteStreams,
      socket,
      user._id,
    ]
  );

  /**
   * Handle player enter and voice chat ready
   */
  // useEffect(() => {
  //   async function onVoiceReady({ error, players }: { error?: Error; players?: User[] }) {
  //     if (error) {
  //       /** @todo - Failed to fetch players error (create new error) */
  //       console.error(error);
  //       return;
  //     }
  //   if (localMediaStream && players && localAudioRef.current) {
  //     const strPlayerIds = room.players.map((playerId: ObjectId) => playerId.toString());

  //     // Add all the players to the list of peers
  //     strPlayerIds.forEach(async (playerId: string) => {
  //       // Exclude "myself" AND exclude people already added as peer
  //       if (playerId !== myUserId && !peerConnections.current[playerId]) {
  //         console.log(`create and send new peer connection for ${playerId}`);
  //         // Create peer connection and assign
  //         const newPeerConnection = createNewPeerConnection(localMediaStream);
  //         // Store into peerConnections object
  //         peerConnections.current[playerId] = newPeerConnection;
  //         // Create and send ICE candidate
  //         setupPeerConnection({ peerConnection: newPeerConnection });
  //         // Create and send offer
  //         await createOfferAndSendSignal({ peerConnection: newPeerConnection, userId: myUserId }); // My user ID
  //       }
  //     });
  //   }
  //   }

  //   socket.on(NamespaceEnum.VOICE_READY, onVoiceReady);
  //   return () => socket.off(NamespaceEnum.VOICE_READY, onVoiceReady);
  // }, [
  //   createNewPeerConnection,
  //   createOfferAndSendSignal,
  //   localMediaStream,
  //   peerConnections,
  //   setupPeerConnection,
  //   socket,
  //   user._id,
  // ]);

  /**
   * Handle player (myself) enter and voice chat ready
   */
  useEffect(() => {
    // FIX: this also affects user already in room (they get refreshed)
    console.log('how many?');

    if (localMediaStream && localAudioRef.current) {
      const strPlayerIds = room.players.map((playerId: ObjectId) => playerId.toString());

      // Add all the players to the list of peers
      strPlayerIds.forEach(async (playerId: string) => {
        // Exclude "myself" AND exclude people already added as peer
        if (playerId !== myUserId && !peerConnections.current[playerId]) {
          console.log(`create and send new peer connection for ${playerId}`);
          // Create peer connection and assign
          const newPeerConnection = createNewPeerConnection(localMediaStream);
          // Store into peerConnections object
          peerConnections.current[playerId] = newPeerConnection;
          // Create and send ICE candidate
          setupPeerConnection({ peerConnection: newPeerConnection });
          // Create and send offer
          await createOfferAndSendSignal({ peerConnection: newPeerConnection, userId: myUserId }); // My user ID
        }
      });
    }

    return () => closeAllPeerConnections();
  }, [
    closeAllPeerConnections,
    createNewPeerConnection,
    createOfferAndSendSignal,
    localMediaStream,
    myUserId,
    peerConnections,
    room.players,
    setupPeerConnection,
  ]);

  /**
   * Handle incoming ice candidate
   */
  useEffect(() => {
    async function onIceCandidate({
      userId: senderId,
      candidate,
    }: {
      userId: string;
      candidate: RTCIceCandidate;
    }) {
      if (peerConnections.current[senderId]) {
        peerConnections.current[senderId]!.addIceCandidate(candidate); // Add sender's candidate to remote description
      } else {
        console.error(`[!] Incoming ice candidate error for ${senderId}.`);
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
      socketId: senderSocketId,
      userId: senderUserId,
      signal,
    }: {
      socketId: string;
      userId: string;
      signal: RTCSessionDescriptionInit;
    }) {
      if (localMediaStream) {
        // Search sender's ID in peer connection
        let peerConnection = peerConnections.current[senderUserId];

        // If sender does not exist: new sender's info arrived
        if (!peerConnection) {
          // Create new peer connection for the offer
          peerConnection = createNewPeerConnection(localMediaStream)!;
          // Create and send ICE candidate
          setupPeerConnection({ peerConnection, toSocketId: senderSocketId }); // Send to specific socket ID
          // Add sender to the list of peers
          peerConnections.current[senderUserId] = peerConnection!;
        }

        await createAnswerAndSendSignal({
          peerConnection,
          signal,
          toSocketId: senderSocketId,
          userId: myUserId,
        });
      }
    }

    socket.on(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
    return () => socket.off(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
  }, [
    createAnswerAndSendSignal,
    createNewPeerConnection,
    localMediaStream,
    myUserId,
    peerConnections,
    setupPeerConnection,
    socket,
  ]);

  /**
   * Handle incoming answer
   */
  useEffect(() => {
    async function onVoiceAnswer({
      userId: senderId,
      signal,
    }: {
      userId: string;
      signal: RTCSessionDescriptionInit;
    }) {
      // If answer is back from the ID stored
      if (peerConnections.current[senderId]) {
        peerConnections.current[senderId]!.setRemoteDescription(signal); // Set sender's signal to remote description
      }
      // Answer came from nowhere (user ID never stored)
      else {
        console.error(`[!] Incoming answer error from ${senderId}. Who is this?`);
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
      <VoiceButton />
      {localMediaStream && <audio ref={localAudioRef} autoPlay controls muted />}
      {<audio ref={remoteAudioRef} autoPlay controls />}

      {/* {Object.entries(audioRefs.remotes.current).map(([userId, stream]) => (
    <audio key={userId} ref={audioRefs.remotes.current[userId]} autoPlay />
  ))} */}
    </>
  );
};

export default VoiceCallLayout;
