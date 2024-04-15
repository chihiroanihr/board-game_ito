import { useEffect } from 'react';

import {
  type ReceiveIceCandidateResponse,
  type ReceiveVoiceOfferResponse,
  type ReceiveVoiceAnswerResponse,
  NamespaceEnum,
} from '@bgi/shared';
import { useSocket } from '@/hooks';

interface VoiceCallCallback {
  onIceCandidateCallback?: (data: ReceiveIceCandidateResponse) => void;
  onVoiceOfferCallback?: (data: ReceiveVoiceOfferResponse) => void;
  onVoiceAnswerCallback?: (data: ReceiveVoiceAnswerResponse) => void;
}

export const useVoiceCall = ({
  onIceCandidateCallback,
  onVoiceOfferCallback,
  onVoiceAnswerCallback,
}: VoiceCallCallback) => {
  const { socket } = useSocket();

  /**
   * Handle incoming ice candidate
   */
  useEffect(() => {
    async function onIceCandidate({ candidate, fromSocketId }: ReceiveIceCandidateResponse) {
      onIceCandidateCallback?.({ candidate, fromSocketId });
    }

    socket.on(NamespaceEnum.RECEIVE_ICE_CANDIDATE, onIceCandidate);
    return () => socket.off(NamespaceEnum.RECEIVE_ICE_CANDIDATE, onIceCandidate);
  }, [onIceCandidateCallback, socket]);

  /**
   * Handle incoming offer
   */
  useEffect(() => {
    async function onVoiceOffer({ signal, fromSocketId }: ReceiveVoiceOfferResponse) {
      onVoiceOfferCallback?.({ signal, fromSocketId });
    }

    socket.on(NamespaceEnum.RECEIVE_VOICE_OFFER, onVoiceOffer);
    return () => socket.off(NamespaceEnum.RECEIVE_VOICE_OFFER, onVoiceOffer);
  }, [onVoiceOfferCallback, socket]);

  /**
   * Handle incoming answer
   */
  useEffect(() => {
    async function onVoiceAnswer({ signal, fromSocketId }: ReceiveVoiceAnswerResponse) {
      onVoiceAnswerCallback?.({ signal, fromSocketId });
    }

    socket.on(NamespaceEnum.RECEIVE_VOICE_ANSWER, onVoiceAnswer);
    return () => socket.off(NamespaceEnum.RECEIVE_VOICE_ANSWER, onVoiceAnswer);
  }, [onVoiceAnswerCallback, socket]);
};
