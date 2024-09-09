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
import { useSocket, useAuth, usePeerConnections } from '@/hooks';
import { LocalMediaStreamManager, outputServerError } from '@/utils';

const VoiceCallLayout = () => {
  const { socket: mySocket } = useSocket();
  const { user } = useAuth();
  const {
    createNewPeerConnection,
    createOfferAndSendSignal,
    createAnswerAndSendSignal,
    setRemotePeerAnswer,
    setRemotePeerCandidate,
  } = usePeerConnections();

  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  // const localAudioRef = useRef<HTMLAudioElement>(null);

  /**
   * Toggle mute button handler
   */
  const toggleMuteMediaStream = useCallback(async () => {
    try {
      // If unmuted for the first time, start the media stream
      if (!LocalMediaStreamManager.hasStream()) {
        await LocalMediaStreamManager.startStream();
        setLocalStream(LocalMediaStreamManager.getStream());
      }

      // If initially muted
      if (isMuted) {
        LocalMediaStreamManager.unmuteStream();
        setIsMuted(false);
      }
      // If initially unmuted
      else {
        LocalMediaStreamManager.muteStream();
        setIsMuted(true);
      }
    } catch (error) {
      console.error('[Media Error] Cannot toggle mute state of the local media stream: ', error);
    }
  }, [isMuted]);

  // When your local media stream is ready
  useEffect(() => {
    if (!localStream) return;
    // if (!localAudioRef.current || !localStream) return;
    // // Add stream to local audio element
    // localAudioRef.current.srcObject = localStream;

    console.log('Sending mic ready status.');

    // Emit mic ready signal to server
    mySocket.emit(NamespaceEnum.MIC_READY, async ({ error }: MicReadyResponse) => {
      if (error) console.error(error);
    });
  }, [localStream, mySocket]);

  useEffect(() => {
    if (!localStream) return;

    const handlePlayerMicReady = async ({
      socketId: remoteSocketId,
      strUserId: remoteStrUserId,
    }: PlayerMicReadyResponse) => {
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
      // Create new data channel (for voice activity detection)
      // createNewDataChannel(newPeerConnection, remoteStrUserId);
      // Create and send offer
      await createOfferAndSendSignal(newPeerConnection, remoteSocketId);
    };

    const handleReceiveVoiceOffer = async ({
      signal,
      fromSocketId,
      fromStrUserId,
    }: ReceiveVoiceOfferResponse) => {
      console.log(`[Voice Offer] Received voice offer: ${fromSocketId}, ${fromStrUserId}`);
      console.log(`[Voice Offer] Create and send new peer connection for\n
        Socket ID: ${fromSocketId}
         User ID: ${fromStrUserId}
      `);
      // Create new peer connection for the offer and send ICE candidate
      const newPeerConnection = createNewPeerConnection(localStream, fromSocketId, fromStrUserId);
      // Create new data channel (for voice activity detection)
      // createNewDataChannel(newPeerConnection, fromStrUserId);
      // Proceed with creating and sending answer
      await createAnswerAndSendSignal(newPeerConnection, signal, fromSocketId);
    };

    const handleReceiveVoiceAnswer = async ({
      signal,
      fromSocketId,
      fromStrUserId,
    }: ReceiveVoiceAnswerResponse) => {
      console.log(`[Voice Answer] Received voice answer: ${fromSocketId}, ${fromStrUserId}`);
      await setRemotePeerAnswer(signal, fromStrUserId);
    };

    const handleReceiveIceCandidate = async ({
      candidate,
      fromSocketId,
      fromStrUserId,
    }: ReceiveIceCandidateResponse) => {
      console.log(`[ICE Candidate] Received ICE candidate: ${fromSocketId}, ${fromStrUserId}`);
      await setRemotePeerCandidate(candidate, fromStrUserId);
    };

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
    createAnswerAndSendSignal,
    createNewPeerConnection,
    createOfferAndSendSignal,
    localStream,
    mySocket,
    setRemotePeerAnswer,
    setRemotePeerCandidate,
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

  return (
    <>
      <VoiceButton isMuted={isMuted} onClick={toggleMuteMediaStream} />

      {/* {localStream && <audio ref={localAudioRef} autoPlay muted />} */}
    </>
  );
};

export default VoiceCallLayout;
