import React, { useEffect, useRef, useCallback } from 'react';
import { Fab, Typography } from '@mui/material';
import { Mic as MicOnIcon, MicOff as MicOffIcon } from '@mui/icons-material';

import { type User, NamespaceEnum } from '@bgi/shared';

import {
  useSocket,
  useAuth,
  useRoom,
  useLocalMediaStream,
  usePeerConnections,
  usePlayerConnectionStatus,
} from '@/hooks';
import { outputServerError } from '@/utils';

const VoiceButton = () => {
  const { socket } = useSocket();
  const { user } = useAuth();
  const { room } = useRoom();
  const { localMediaStream, closeMediaStream, isMuted, toggleMic } = useLocalMediaStream();
  const { peerConnections, closePeerConnection, restartPeerConnection, createNewPeerConnection } =
    usePeerConnections();

  const localAudioRef = useRef<HTMLAudioElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  // const remoteAudioRefs = useRef<{ [key: string]: React.RefObject<HTMLAudioElement> }>({});

  // const [speakingUser, setSpeakingUser] = useState<User>();

  // Function to handle incoming voice data from other users
  // const handleVoiceData = ({ data, user }: { data: MediaStream | undefined; user: User }) => {
  //   console.log('handleVoiceData: ', data);
  //   // Play incoming audio data
  //   setSpeakingUser(data);
  // };

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

  const setupPeerConnection = useCallback(
    ({
      peerConnection,
      toSocketId,
    }: {
      peerConnection: RTCPeerConnection;
      toSocketId?: string;
    }) => {
      // Handle peer connection state change
      peerConnection.onconnectionstatechange = () =>
        handleEventConnectionStateChange(peerConnection);

      // Handle remote audio stream
      peerConnection.ontrack = (event) => handleEventTrackRemoteStreams(event);

      // Handle ICE candidates (send ice candidate)
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit(NamespaceEnum.VOICE_CANDIDATE, {
            toSocketId: toSocketId, // If sending to specific socket ID
            userId: user._id.toString(),
            candidate: event.candidate,
          });
        }
      };
    },
    [handleEventConnectionStateChange, handleEventTrackRemoteStreams, socket, user._id]
  );

  const createOfferAndSendSignal = useCallback(
    async ({ peerConnection, userId }: { peerConnection: RTCPeerConnection; userId: string }) => {
      try {
        // Create an offer
        const offer = await peerConnection.createOffer();
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

  /**
   * Handle player (myself) enter and voice chat ready
   */
  useEffect(() => {
    socket.emit(
      NamespaceEnum.VOICE_READY,
      async ({ error, playerIds }: { error?: Error; playerIds?: string[] }) => {
        if (error) {
          outputServerError({ error });
        } else if (!playerIds) {
          /** @todo - Failed to fetch players error (create new error) */
          console.error('Failed to fetch player IDs.');
        } else {
          if (localMediaStream) {
            console.log('Audio detected.');
            const myUserId = user._id.toString();

            // Create temp peer connections
            const tempPeerConnections = {} as { [key: string]: RTCPeerConnection };

            // Add all the players to the list of peers
            playerIds.forEach((playerId) => {
              // Exclude "myself" AND exclude people already added as peer
              if (playerId !== myUserId && !peerConnections.current[playerId]) {
                // Create peer connection
                const peerConnection = createNewPeerConnection(); // My user ID & socket ID
                // Create and send ICE candidate
                setupPeerConnection({ peerConnection });
                // Create and send offer
                createOfferAndSendSignal({ peerConnection, userId: myUserId });

                // Save peer connection to temp
                tempPeerConnections[playerId] = peerConnection;
              }
            });

            // Update peer connections state based on previous state
            peerConnections.current = {
              ...peerConnections.current,
              ...tempPeerConnections,
            };
          }
        }
      }
    );
  }, [
    createNewPeerConnection,
    createOfferAndSendSignal,
    localMediaStream,
    peerConnections,
    setupPeerConnection,
    socket,
    user._id,
  ]);

  /**
   * Handle player enter and voice chat ready
   */
  useEffect(() => {
    async function onVoiceReady({ error, players }: { error?: Error; players?: User[] }) {
      if (error) {
        /** @todo - Failed to fetch players error (create new error) */
        console.error(error);
        return;
      }
      if (players && localMediaStream) {
        console.log('Audio detected.');
        const myUserId = user._id.toString();

        // Create temp peer connections
        const tempPeerConnections = {} as { [key: string]: RTCPeerConnection };

        // Add all the players to the list of peers
        players.forEach(async (player) => {
          // Get player's ID
          const playerId = player._id.toString();

          // Exclude "myself" AND exclude people already added as peer
          if (playerId !== myUserId && !peerConnections.current[playerId]) {
            // Create peer connection
            const peerConnection = createNewPeerConnection(); // My user ID & socket ID
            // Create and send ICE candidate
            setupPeerConnection({ peerConnection });
            // Create and send offer
            await createOfferAndSendSignal({ peerConnection, userId: myUserId });

            // Save peer connection to temp
            tempPeerConnections[playerId] = peerConnection;
          }
        });

        // Update peer connections state based on previous state
        peerConnections.current = {
          ...peerConnections.current,
          ...tempPeerConnections,
        };
      }
    }

    socket.on(NamespaceEnum.VOICE_READY, onVoiceReady);
    return () => socket.off(NamespaceEnum.VOICE_READY, onVoiceReady);
  }, [
    createNewPeerConnection,
    createOfferAndSendSignal,
    localMediaStream,
    peerConnections,
    setupPeerConnection,
    socket,
    user._id,
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
      const myUserId = user._id.toString();

      // Search sender's ID in peer connection
      let peerConnection = peerConnections.current[senderUserId];

      // If sender does not exist: new sender's info arrived
      if (!peerConnection) {
        // Create new peer connection for the offer
        peerConnection = createNewPeerConnection()!;
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

    socket.on(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
    return () => socket.off(NamespaceEnum.VOICE_OFFER, onVoiceOffer);
  }, [
    createAnswerAndSendSignal,
    createNewPeerConnection,
    peerConnections,
    setupPeerConnection,
    socket,
    user._id,
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

  if (!peerConnections.current || peerConnections.current.length === 0) {
    console.log('No peer connections.');
  }
  for (const key of Object.keys(peerConnections.current)) {
    const peerConnection = peerConnections.current[key];
    if (peerConnection) {
      console.log(
        peerConnection.connectionState,
        peerConnection.iceConnectionState,
        peerConnection
      );
    }
  }

  return (
    <>
      <Fab
        component="button"
        color="primary"
        aria-describedby={isMuted ? 'mic-button' : undefined}
        disabled={!localMediaStream}
        onClick={toggleMic}
      >
        {isMuted ? (
          <MicOffIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} />
        ) : (
          <MicOnIcon sx={{ width: 'unset', height: 'unset', p: '0.6rem' }} color="error" />
        )}
      </Fab>
      {localMediaStream && <audio ref={localAudioRef} autoPlay controls muted />}
      {<audio ref={remoteAudioRef} autoPlay controls />}

      {/* {Object.entries(audioRefs.remotes.current).map(([userId, stream]) => (
        <audio key={userId} ref={audioRefs.remotes.current[userId]} autoPlay />
      ))} */}
      {/* 
      {speakingUser && <Typography variant="body2">Speaking: {speakingUser.name}</Typography>} */}
    </>
  );
};

export default VoiceButton;
