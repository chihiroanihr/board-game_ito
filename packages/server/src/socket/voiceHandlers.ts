import { Socket, Server } from 'socket.io';

import {
  type MicReadyCallback,
  type PlayerMicReadyResponse,
  type ReceiveIceCandidateResponse,
  type ReceiveVoiceOfferResponse,
  type ReceiveVoiceAnswerResponse,
  type RTCIceCandidateData,
  type RTCSessionDescriptionData,
  NamespaceEnum,
} from '@bgi/shared';

import * as log from '../log';

/**
 * @function handleSocketMicReady - Handle socket mic ready event
 * @socket_event - Mic Ready
 * @param socket - Socket instance
 */
export const handleSocketMicReady = (socket: Socket) => {
  /** @socket_receive */
  socket.on(NamespaceEnum.MIC_READY, async (callback: MicReadyCallback) => {
    // [0] Receive mic ready event from client
    try {
      // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
      if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
      if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

      // [2] Notify mic ready event to all clients in the room (except the sender) with the sender's socket ID
      /** @socket_emit */
      socket
        .to(socket.room._id)
        .emit(NamespaceEnum.PLAYER_MIC_READY, { socketId: socket.id } as PlayerMicReadyResponse); // Send back the client's own socket ID

      // [3] Send back success response to client
      /** @socket_callback */
      callback({});

      // [4] Log mic ready event
      log.logSocketEvent('Mic Ready', socket);
    } catch (error) {
      // [~0] Send back error response to client
      const errorResponse = error instanceof Error ? error : new Error(String(error));
      /** @socket_callback */
      callback({ error: errorResponse });

      // [1] Log error event
      log.handleServerError(error, 'handleSocketMicReady');
    }
  });
};

/**
 * @function handleSocketIceCandidate - Handle socket ice candidate event
 * @socket_event - ICE Candidate
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketIceCandidate = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.SEND_ICE_CANDIDATE,
    async ({ candidate, fromSocketId, toSocketId }: RTCIceCandidateData) => {
      // [0] Receive ice candidate event from client
      try {
        // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
        if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

        // [2] Broadcast (send) ice candidate event to SPECIFIC clients in the room
        /** @socket_io_emit */
        io.to(toSocketId).emit(NamespaceEnum.RECEIVE_ICE_CANDIDATE, {
          candidate,
          fromSocketId,
        } as ReceiveIceCandidateResponse);

        // [3] Log ice candidate event
        log.logSocketEvent('ICE Candidate', socket);
      } catch (error) {
        // [~0] Log error event
        log.handleServerError(error, 'handleSocketIceCandidate');
      }
    }
  );
};

/**
 * @function handleSocketVoiceOffer - Handle socket voice offer event
 * @socket_event - Voice Offer
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketVoiceOffer = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.SEND_VOICE_OFFER,
    async ({ signal, fromSocketId, toSocketId }: RTCSessionDescriptionData) => {
      // [0] Receive voice offer event from client
      try {
        // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
        if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

        // [2] Broadcast (send) voice offer event to SPECIFIC clients in the room
        /** @socket_io_emit */
        io.to(toSocketId).emit(NamespaceEnum.RECEIVE_VOICE_OFFER, {
          signal,
          fromSocketId,
        } as ReceiveVoiceOfferResponse);

        // [3] Log voice offer event
        log.logSocketEvent('Voice Offer', socket);
      } catch (error) {
        // [~0] Log error event
        log.handleServerError(error, 'handleSocketVoiceOffer');
      }
    }
  );
};

/**
 * @function handleSocketVoiceAnswer - Handle socket voice answer event
 * @socket_event - Voice Answer
 * @param socket - Socket instance
 * @param io - Server instance
 */
export const handleSocketVoiceAnswer = (socket: Socket, io: Server) => {
  /** @socket_receive */
  socket.on(
    NamespaceEnum.SEND_VOICE_ANSWER,
    async ({ signal, fromSocketId, toSocketId }: RTCSessionDescriptionData) => {
      // [0] Receive voice answer event from client
      try {
        // [1] Validate user and room exists (if user is not connected and user is not in a room, throw error)
        if (!socket.user?._id) throw new Error('[Socket Error]: User is not connected.');
        if (!socket.room?._id) throw new Error('[Socket Error]: Room is not connected.');

        // [2] Broadcast (send) voice answer event to SPECIFIC clients in the room
        /** @socket_io_emit */
        io.to(toSocketId).emit(NamespaceEnum.RECEIVE_VOICE_ANSWER, {
          signal,
          fromSocketId,
        } as ReceiveVoiceAnswerResponse);

        // [3] Log voice answer event
        log.logSocketEvent('Voice Answer', socket);
      } catch (error) {
        // [~0] Log error event
        log.handleServerError(error, 'handleSocketVoiceAnswer');
      }
    }
  );
};
