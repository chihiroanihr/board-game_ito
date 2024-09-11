import React, { useCallback, useEffect, useState } from 'react';

import {
  type MicReadyResponse,
  type PlayerMicReadyResponse,
  type ReceiveIceCandidateResponse,
  type ReceiveVoiceOfferResponse,
  type ReceiveVoiceAnswerResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { VoiceButton } from '@/components';
import { useSocket, usePeerConnections } from '@/hooks';
import { LocalMediaStreamManager } from '@/services';
import { outputServerError } from '@/utils';

const VoiceCallLayout = () => {
  const { socket: mySocket } = useSocket();

  const {
    peerConnections,
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
    setRemotePeerAnswer,
    setRemotePeerCandidate,
  } = usePeerConnections();

  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // const localAudioRef = useRef<HTMLAudioElement>(null);

  const startMediaStream = useCallback(async () => {
    // If unmuted for the first time, start the media stream
    if (!LocalMediaStreamManager.hasStream()) {
      await LocalMediaStreamManager.startStream();
      setLocalStream(LocalMediaStreamManager.getStream());
    }
  }, []);

  useEffect(() => {
    startMediaStream();
  }, [startMediaStream]);

  // When your local media stream is ready
  useEffect(() => {
    if (!localStream) return;
    // if (!localAudioRef.current || !localStream) return;
    // // Add stream to local audio element
    // localAudioRef.current.srcObject = localStream;

    console.log('Sending mic ready status.');

    // Emit mic ready signal to server
    mySocket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
      if (error) outputServerError(error);
    });
  }, [localStream, mySocket]);

  /**
   * Toggle mute button handler
   */
  const handleToggleMute = useCallback(async () => {
    console.log(peerConnections.current);

    try {
      if (isMuted) {
        // If initially muted then unmute
        LocalMediaStreamManager.unmuteStream();
        setIsMuted(false);
        // Send the updated mute state to all connected peers
        Object.values(peerConnections.current).forEach((peerConnection) => {
          const dataChannel = (peerConnection as RTCPeerConnection).createDataChannel('mute-state');
          // Check if the data channel is open before sending the message
          if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ muted: false }));
          } else {
            // If the data channel is not open, wait for it to open and then send the message
            dataChannel.onopen = () => {
              dataChannel.send(JSON.stringify({ muted: false }));
            };
          }
        });
      } else {
        // If initially unmuted then mute
        LocalMediaStreamManager.muteStream();
        setIsMuted(true);
        // Send the updated mute state to all connected peers
        Object.values(peerConnections.current).forEach((peerConnection) => {
          const dataChannel = (peerConnection as RTCPeerConnection).createDataChannel('mute-state');
          // Check if the data channel is open before sending the message
          if (dataChannel.readyState === 'open') {
            dataChannel.send(JSON.stringify({ muted: true }));
          } else {
            // If the data channel is not open, wait for it to open and then send the message
            dataChannel.onopen = () => {
              dataChannel.send(JSON.stringify({ muted: true }));
            };
          }
        });
      }
    } catch (error) {
      console.error('[Media Error] Cannot toggle mute state of the local media stream: ', error);
    }
  }, [isMuted, peerConnections]);

  const handlePlayerMicReady = useCallback(
    async ({ socketId: remoteSocketId, strUserId: remoteStrUserId }: PlayerMicReadyResponse) => {
      console.log(`[MicReady] Received player mic ready: ${remoteSocketId}, ${remoteStrUserId}`);
      // Avoid duplicate creation due to multi-rendering
      console.log(`[MicReady] Create and send new peer connection for\n
        Socket ID: ${remoteSocketId}
         User ID: ${remoteStrUserId}
      `);
      // Create new peer connection and send ICE candidate to new player
      const newPeerConnection = createNewPeerConnection(
        localStream,
        remoteSocketId,
        remoteStrUserId
      );
      // Create and send offer
      await createOfferAndSendSignal(newPeerConnection, remoteSocketId);
    },
    [createNewPeerConnection, createOfferAndSendSignal, localStream]
  );

  const handleReceiveVoiceOffer = useCallback(
    async ({ signal, fromSocketId, fromStrUserId }: ReceiveVoiceOfferResponse) => {
      console.log(`[Voice Offer] Received voice offer: ${fromSocketId}, ${fromStrUserId}`);
      console.log(`[Voice Offer] Create and send new peer connection for\n
      Socket ID: ${fromSocketId}
       User ID: ${fromStrUserId}
    `);
      // Create new peer connection for the offer and send ICE candidate
      const newPeerConnection = createNewPeerConnection(localStream, fromSocketId, fromStrUserId);
      // Proceed with creating and sending answer
      await createAnswerAndSendSignal(newPeerConnection, signal, fromSocketId);
    },
    [createAnswerAndSendSignal, createNewPeerConnection, localStream]
  );

  const handleReceiveVoiceAnswer = useCallback(
    async ({ signal, fromSocketId, fromStrUserId }: ReceiveVoiceAnswerResponse) => {
      console.log(`[Voice Answer] Received voice answer: ${fromSocketId}, ${fromStrUserId}`);
      await setRemotePeerAnswer(signal, fromStrUserId);
    },
    [setRemotePeerAnswer]
  );

  const handleReceiveIceCandidate = useCallback(
    async ({ candidate, fromSocketId, fromStrUserId }: ReceiveIceCandidateResponse) => {
      console.log(`[ICE Candidate] Received ICE candidate: ${fromSocketId}, ${fromStrUserId}`);
      await setRemotePeerCandidate(candidate, fromStrUserId);
    },
    [setRemotePeerCandidate]
  );

  useEffect(() => {
    if (!localStream) return;

    mySocket.on(NamespaceEnum.PLAYER_MIC_READY, handlePlayerMicReady);
    mySocket.on(NamespaceEnum.RECEIVE_VOICE_OFFER, handleReceiveVoiceOffer);
    mySocket.on(NamespaceEnum.RECEIVE_VOICE_ANSWER, handleReceiveVoiceAnswer);
    mySocket.on(NamespaceEnum.RECEIVE_ICE_CANDIDATE, handleReceiveIceCandidate);

    return () => {
      mySocket.off(NamespaceEnum.PLAYER_MIC_READY, handlePlayerMicReady);
      mySocket.off(NamespaceEnum.RECEIVE_VOICE_OFFER, handleReceiveVoiceOffer);
      mySocket.off(NamespaceEnum.RECEIVE_VOICE_ANSWER, handleReceiveVoiceAnswer);
      mySocket.off(NamespaceEnum.RECEIVE_ICE_CANDIDATE, handleReceiveIceCandidate);
    };
  }, [
    handlePlayerMicReady,
    handleReceiveIceCandidate,
    handleReceiveVoiceAnswer,
    handleReceiveVoiceOffer,
    localStream,
    mySocket,
  ]);

  // useEffect(() => {
  //   console.log('LOCAL MEDIA STREAM: ', localStream?.getTracks()[0]);
  //   console.log('PEER CONNECTIONS: ', peerConnections.current);
  //   Object.entries(
  //     peerConnections.current as React.MutableRefObject<Record<string, RTCPeerConnection>>
  //   ).map(([playerId, connection]) => {
  //     console.log(playerId);
  //     console.log(connection);
  //   });
  // }, [localStream, peerConnections]);

  /* {localStream && <audio ref={localAudioRef} autoPlay muted />} */

  return <VoiceButton isMuted={isMuted} onClick={handleToggleMute} />;
};

export default VoiceCallLayout;
