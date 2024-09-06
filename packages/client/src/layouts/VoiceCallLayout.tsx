import React, { useEffect, useRef, useCallback, useState } from 'react';

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
  useVoiceActivity,
} from '@/hooks';
import { outputServerError } from '@/utils';
import type { SetUpPeerConnectionType, PeerConnectionsDataType } from '../enum';

const VoiceCallLayout = ({
  setActiveSpeakers,
}: {
  setActiveSpeakers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const { socket: mySocket } = useSocket();
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

  const isLocalActive = useVoiceActivity({ stream: localMediaStream, threshold: 5 });

  // Update who is currently speaking
  useEffect(() => {
    if (isLocalActive) {
      setActiveSpeakers((prev) => [...prev, user._id.toString()]);
    } else {
      setActiveSpeakers((prev) => prev.filter((id) => id !== user._id.toString()));
    }
  }, [isLocalActive, user._id, setActiveSpeakers]);

  // When mute button is toggled
  useEffect(() => {
    muteFromAllPeerConnections(peerConnections.current, localMediaStream, isMuted);
  }, [isMuted, localMediaStream, muteFromAllPeerConnections, peerConnections]);

  // When your local stream (localMediaStream) is ready
  useEffect(() => {
    if (localAudioRef.current && localMediaStream) {
      localAudioRef.current.srcObject = localMediaStream;

      mySocket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
        if (error) console.error(error);
      });
    }
  }, [localMediaStream, mySocket]);

  const handlePlayerLeft = ({ socketId, user: player, room }: PlayerOutResponse) => {
    closePeerConnection(player._id.toString()); // Close peer connection for player just disconnected
  };
  const handlePlayerDisconnected = ({ socketId, user: player }: PlayerDisconnectedResponse) => {
    closePeerConnection(player._id.toString()); // Close peer connection for player just disconnected
  };
  /**
   * Player connection status hook
   */
  usePlayerStatus({
    onPlayerLeftCallback: handlePlayerLeft,
    onPlayerDisconnectedCallback: handlePlayerDisconnected,
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

  /**
   * @function handleEventTrackRemoteStreams - Handles track remote streams
   * @param {RTCTrackEvent} event - The track remote stream event
   * @returns {void}
   * [RECEIVER] [3]
   */
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

  /**
   * @function setupPeerConnection - Sets up a new peer connection
   * @param {Object} params - The parameters for the new peer connection
   * @param {RTCPeerConnection} params.peerConnection - The new peer connection
   * @param {string} params.fromSocketId - The socket ID of the sender
   * @param {string} params.toSocketId - The socket ID of the receiver
   * @returns {void}
   * [RECEIVER] [2]
   */
  const setupPeerConnection = useCallback(
    ({ peerConnection, toSocketId }: SetUpPeerConnectionType) => {
      // Handle remote audio stream
      peerConnection.ontrack = (event: RTCTrackEvent) => {
        handleEventTrackRemoteStreams(event);
      };
      // Handle peer connection state change
      peerConnection.onconnectionstatechange = () =>
        handleEventConnectionStateChange(peerConnection);
      peerConnection.oniceconnectionstatechange = () =>
        handleEventIceConnectionStateChange(peerConnection);

      // Handle ICE candidates (send ice candidate)
      peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
        if (event.candidate) {
          mySocket.emit(NamespaceEnum.SEND_ICE_CANDIDATE, {
            candidate: event.candidate,
            toSocketId,
          });
        }
      };
    },
    [handleEventConnectionStateChange, handleEventIceConnectionStateChange, mySocket]
  );

  /**
   * Handle incoming player voice-ready status
   * [RECEIVER] [1]
   */
  useEffect(() => {
    const onPlayerMicReady = async ({
      socketId: playerSocketId,
      strUserId: playerStrUserId,
    }: PlayerMicReadyResponse) => {
      // Avoid duplicate creation due to multi-rendering
      if (!peerConnections.current[playerStrUserId]) {
        console.log(`[SENDER] create and send new peer connection for\n
          Socket ID: ${playerSocketId}
           User ID: ${playerStrUserId}
        `);
        // Create peer connection and assign
        const newPeerConnection = createNewPeerConnection(localMediaStream);
        // Store new player into peerConnections object
        peerConnections.current[playerStrUserId] = newPeerConnection;
        // Create and send ICE candidate to new player
        setupPeerConnection({
          peerConnection: newPeerConnection,
          toSocketId: playerSocketId,
        });
        // Create and send offer
        await createOfferAndSendSignal({
          peerConnection: newPeerConnection,
          toSocketId: playerSocketId,
        });
      }
    };

    mySocket.on(NamespaceEnum.PLAYER_MIC_READY, onPlayerMicReady);
    return () => mySocket.off(NamespaceEnum.PLAYER_MIC_READY, onPlayerMicReady);
  }, [
    createNewPeerConnection,
    createOfferAndSendSignal,
    localMediaStream,
    mySocket,
    peerConnections,
    setupPeerConnection,
  ]);

  /**
   * Handle incoming ice candidate
   */
  useEffect(() => {
    async function onIceCandidate({
      candidate,
      fromSocketId,
      fromStrUserId,
    }: ReceiveIceCandidateResponse) {
      if (peerConnections.current[fromStrUserId]) {
        peerConnections.current[fromStrUserId].addIceCandidate(candidate); // Add sender's candidate to remote description
      } else {
        console.error(`[!] Incoming ice candidate error for\n
          Socket ID: ${fromSocketId}
          User ID: ${fromStrUserId}.
        `);
      }
    }

    mySocket.on(NamespaceEnum.RECEIVE_ICE_CANDIDATE, onIceCandidate);
    return () => mySocket.off(NamespaceEnum.RECEIVE_ICE_CANDIDATE, onIceCandidate);
  }, [peerConnections, mySocket]);

  /**
   * Handle incoming offer
   */
  useEffect(() => {
    async function onVoiceOffer({
      signal,
      fromSocketId,
      fromStrUserId,
    }: ReceiveVoiceOfferResponse) {
      // Search sender's ID in peer connection
      let peerConnection = peerConnections.current[fromStrUserId];

      // If sender does not exist: new sender's info arrived
      if (!peerConnection) {
        console.log(`[SENDER] create and send new peer connection for\n
          Socket ID: ${fromSocketId}
           User ID: ${fromStrUserId}
        `);
        // Create new peer connection for the offer
        peerConnection = createNewPeerConnection(localMediaStream)!;
        // Add sender to the list of peers
        peerConnections.current[fromStrUserId] = peerConnection;
        // Create and send ICE candidate
        setupPeerConnection({
          peerConnection,
          toSocketId: fromSocketId,
        });
      }

      // Proceed with creating and sending answer
      await createAnswerAndSendSignal({
        peerConnection,
        signal,
        toSocketId: fromSocketId,
      });
    }

    mySocket.on(NamespaceEnum.RECEIVE_VOICE_OFFER, onVoiceOffer);
    return () => mySocket.off(NamespaceEnum.RECEIVE_VOICE_OFFER, onVoiceOffer);
  }, [
    createAnswerAndSendSignal,
    createNewPeerConnection,
    localMediaStream,
    peerConnections,
    setupPeerConnection,
    mySocket,
  ]);

  /**
   * Handle incoming answer
   * [RECEIVER] [4]
   */
  useEffect(() => {
    async function onVoiceAnswer({
      signal,
      fromSocketId,
      fromStrUserId,
    }: ReceiveVoiceAnswerResponse) {
      // If answer is back from the ID stored
      if (peerConnections.current[fromStrUserId]) {
        peerConnections.current[fromStrUserId].setRemoteDescription(signal); // Set sender's signal to remote description
      }
      // Answer came from nowhere (user ID never stored)
      else {
        console.error(`[!] Incoming answer error from \n\
          \tSocket ID: ${fromSocketId}\n
          \tUser ID: ${fromStrUserId}\n
          Who is this?
        `);
      }
    }

    mySocket.on(NamespaceEnum.RECEIVE_VOICE_ANSWER, onVoiceAnswer);
    return () => mySocket.off(NamespaceEnum.RECEIVE_VOICE_ANSWER, onVoiceAnswer);
  }, [peerConnections, mySocket]);

  /** @LOG */
  if (!peerConnections.current) {
    console.log('No peer connections.');
  } else {
    console.log(peerConnections.current);
  }

  return (
    <>
      <VoiceButton isMuted={isMuted} disabled={!localMediaStream} onClick={toggleMuteMediaStream} />

      {localMediaStream && <audio ref={localAudioRef} autoPlay muted />}

      {Object.entries((peerConnections as PeerConnectionsDataType).current).map(
        ([playerId, connection]) => (
          <PeerAudio
            key={playerId}
            connection={connection as RTCPeerConnection | undefined}
            playerId={playerId as string}
            setActiveSpeakers={setActiveSpeakers}
          />
        )
      )}
    </>
  );
};

export default VoiceCallLayout;

const PeerAudio = ({
  connection,
  playerId,
  setActiveSpeakers,
}: {
  connection: RTCPeerConnection | undefined;
  playerId: string;
  setActiveSpeakers: React.Dispatch<React.SetStateAction<string[]>>;
}) => {
  const remoteAudioRef = useRef<HTMLAudioElement>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!connection) return;

    // Listen for remote tracks
    const onTrack = (event: RTCTrackEvent) => {
      // Get remote stream
      const remoteStream = event.streams[0];
      if (remoteStream) {
        setRemoteStream(remoteStream);
      }
    };
    connection.addEventListener('track', onTrack);
    return () => connection.removeEventListener('track', onTrack);
  }, [connection]);

  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const isRemoteActive = useVoiceActivity({ remoteStream, threshold: 5 });

  useEffect(() => {
    if (isRemoteActive) {
      setActiveSpeakers((prev) => [...prev, playerId]);
    } else {
      setActiveSpeakers((prev) => prev.filter((id) => id !== playerId));
    }
  }, [isRemoteActive, setActiveSpeakers, playerId]);

  return <audio ref={remoteAudioRef} autoPlay />;
};
