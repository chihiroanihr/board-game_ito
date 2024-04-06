import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  type User,
  type Room,
  type RoomSetting,
  type RoomChatMessage,
  type LoginResponse,
  type LogoutResponse,
  type CreateRoomResponse,
  type JoinRoomResponse,
  type EditRoomResponse,
  type LeaveRoomResponse,
  type SendChatResponse,
  NamespaceEnum,
} from '@bgi/shared';

import { useAuth, useRoom, useSocket, useSubmissionStatus } from '@/hooks';
import {
  outputServerError,
  outputResponseTimeoutError,
  navigateHome,
  navigateDashboard,
  navigateWaiting,
} from '@/utils';
import {
  type LoginFormDataType,
  type JoinRoomFormDataType,
  type SendChatFormDataType,
} from '../enum';

export type BeforeSubmitCallbackParams = { action?: NamespaceEnum };
export interface BeforeSubmitCallbackFunction {
  (data: BeforeSubmitCallbackParams): void;
}

export type ErrorCallbackParams = { action?: NamespaceEnum; message?: string };
export interface ErrorCallbackFunction {
  (error: ErrorCallbackParams): void;
}

export type SuccessCallbackParams = { action?: NamespaceEnum; user?: User; room?: Room };
export interface SuccessCallbackFunction {
  (data: SuccessCallbackParams): void;
}

interface UseActionCallback {
  beforeSubmit?: BeforeSubmitCallbackFunction;
  onError?: ErrorCallbackFunction;
  onSuccess?: SuccessCallbackFunction;
}

export const useAction = ({ beforeSubmit, onError, onSuccess }: UseActionCallback) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, updateUser, discardUser } = useAuth();
  const { room, updateRoom, discardRoom } = useRoom();
  const { setIsSubmitting } = useSubmissionStatus();

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingButton, setLoadingButton] = useState<boolean | undefined>();

  // Shared loading button
  const processButtonStatus = (status: boolean) => {
    setLoadingButton(status);
    setIsSubmitting(status);
  };

  /**
   * Handler for user logging into the game.
   * @param data
   * @returns
   */
  const handleLogin = (data: LoginFormDataType) => {
    processButtonStatus(true); // Set submitting to true when the request is initiated
    setErrorMessage(''); // Reset error message

    beforeSubmit?.({ action: NamespaceEnum.LOGIN }); // Execute the beforeSubmit callback before initiating the request

    const userName = data.name.trim(); // Trim any start/end spaces
    // [*] ERROR
    if (!userName) {
      setErrorMessage('Please enter a valid name.');
      processButtonStatus(false);
      onError?.({ action: NamespaceEnum.LOGIN });
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false); // Set submitting to false when the input error happens
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.LOGIN });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LOGIN, userName, async ({ error, user }: LoginResponse) => {
      clearTimeout(timeoutId); // Clear the timeout as response is received before timeout

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.LOGIN,
          message: 'Internal Server Error: Please try again.',
        });
      }
      // [*] SUCCESS
      else {
        updateUser(user ? user : null); // Login and save user info to local storage
        navigateDashboard(navigate); // Navigate
        onSuccess?.({ action: NamespaceEnum.LOGIN, user: user }); // Success callback
      }

      processButtonStatus(false); // Set submitting to false when the response is received
    });
  };

  /**
   * Handler for user logging out of the game.
   */
  const handleLogout = () => {
    processButtonStatus(true); // Set submitting to true when the request is initiated

    beforeSubmit?.({ action: NamespaceEnum.LOGOUT }); // Execute the beforeSubmit callback before initiating the request

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.LOGOUT });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LOGOUT, async ({ error }: LogoutResponse) => {
      clearTimeout(timeoutId);

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.LOGOUT,
          message: 'Internal Server Error: Please try again.',
        });
      }
      // [*] SUCCESS
      else {
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate
        onSuccess?.({ action: NamespaceEnum.LOGOUT }); // Success callback
      }

      processButtonStatus(false);
    });
  };

  /**
   * Handler for creating game room (by admin).
   * @param formData
   */
  const handleCreateRoom = (formData: RoomSetting) => {
    processButtonStatus(true); // Set submitting to true when the request is initiated
    setErrorMessage(''); // Reset error message

    beforeSubmit?.({ action: NamespaceEnum.CREATE_ROOM }); // Execute the beforeSubmit callback before initiating the request

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.CREATE_ROOM });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.CREATE_ROOM,
      formData,
      async ({ error, user, room }: CreateRoomResponse) => {
        clearTimeout(timeoutId);

        // [*] ERROR
        if (error) {
          outputServerError({ error });
          setErrorMessage('Internal Server Error: Please try again.');
          onError?.({
            action: NamespaceEnum.CREATE_ROOM,
            message: 'Internal Server Error: Please try again.',
          });
        }
        // [*] SUCCESS
        else {
          updateUser(user ? user : null); // Store updated user info to local storage
          updateRoom(room ? room : null); // Store room info to local storage and redirect
          navigateWaiting(navigate); // Navigate
          onSuccess?.({ action: NamespaceEnum.CREATE_ROOM, user, room }); // Success callback
        }

        processButtonStatus(false);
      }
    );
  };

  /**
   * Handler for joining to game waiting room.
   * @param data
   * @returns
   */
  const handleJoinRoom = (data: JoinRoomFormDataType) => {
    processButtonStatus(true); // Set submitting to true when the request is initiated
    setErrorMessage(''); // Reset error message

    beforeSubmit?.({ action: NamespaceEnum.JOIN_ROOM }); // Execute the beforeSubmit callback before initiating the request

    const roomId = data.roomId.trim().toUpperCase();
    // [*] ERROR
    if (!roomId) {
      processButtonStatus(false);
      setErrorMessage('Please enter a valid Room ID.');
      onError?.({ action: NamespaceEnum.JOIN_ROOM, message: 'Please enter a valid Room ID.' });
      return;
    }

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.JOIN_ROOM });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(
      NamespaceEnum.JOIN_ROOM,
      roomId,
      async ({ error, user, room }: JoinRoomResponse) => {
        clearTimeout(timeoutId);

        // [*] ERROR
        if (error) {
          outputServerError({ error });
          setErrorMessage('Internal Server Error: Please try again.');
          onError?.({
            action: NamespaceEnum.JOIN_ROOM,
            message: 'Internal Server Error: Please try again.',
          });
        } else {
          // [*] SUCCESS: User can join room
          if (typeof room === 'object') {
            updateUser(user ? user : null); // Store updated user info to local storage
            updateRoom(room ? room : null); // Save room info to local storage and navigate
            navigateWaiting(navigate); // Navigate
            onSuccess?.({ action: NamespaceEnum.JOIN_ROOM, user, room }); // Success callback
          }
          // [*] ERROR: User cannot join room
          else {
            const unavailableMsg = room; // room is now string message
            setErrorMessage(unavailableMsg || 'You cannot join this room for unknown reason.');
            onError?.({
              action: NamespaceEnum.JOIN_ROOM,
              message: unavailableMsg || 'You cannot join this room for unknown reason.',
            });
          }
        }

        processButtonStatus(false);
      }
    );
  };

  /**
   * Handler for editing room setting (inside game waiting room).
   * @param formData
   */
  const handleEditRoom = (formData: RoomSetting) => {
    processButtonStatus(true);

    beforeSubmit?.({ action: NamespaceEnum.EDIT_ROOM }); // Execute the beforeSubmit callback before initiating the request

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.EDIT_ROOM });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.EDIT_ROOM, formData, async ({ error, room }: EditRoomResponse) => {
      clearTimeout(timeoutId);

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.EDIT_ROOM,
          message: 'Internal Server Error: Please try again.',
        });
      }
      // [*] SUCCESS
      else {
        updateRoom(room ? room : null); // Update room info to local storage
        onSuccess?.({ action: NamespaceEnum.EDIT_ROOM }); // Success callback
      }

      processButtonStatus(false);
    });
  };

  /**
   * Handler for leaving gamer room.
   */
  const handleLeaveRoom = () => {
    processButtonStatus(true);

    beforeSubmit?.({ action: NamespaceEnum.LEAVE_ROOM }); // Execute the beforeSubmit callback before initiating the request

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.LEAVE_ROOM });
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LEAVE_ROOM, async ({ error }: LeaveRoomResponse) => {
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.LEAVE_ROOM,
          message: 'Internal Server Error: Please try again.',
        });
      } else {
        discardRoom();
        navigateDashboard(navigate);
        onSuccess?.({ action: NamespaceEnum.LEAVE_ROOM }); // Success callback
      }

      processButtonStatus(false);
    });
  };

  /**
   * Handler for sending chat message.
   * (NO SHARED LOADING BUTTON)
   * @param data
   * @returns
   */
  const handleSendChat = (data: SendChatFormDataType) => {
    setErrorMessage(''); // Reset error message

    beforeSubmit?.({ action: NamespaceEnum.SEND_CHAT }); // Execute the beforeSubmit callback before initiating the request

    const message = data.message.trim(); // Trim any start/end spaces
    // [*] ERROR
    if (!message) {
      setErrorMessage('Please enter a message.');
      onError?.({ action: NamespaceEnum.SEND_CHAT });
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.SEND_CHAT });
    }, 5000);

    const chatData: RoomChatMessage = {
      fromUser: user,
      message: message,
      timestamp: Date.now(),
    };

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.SEND_CHAT, chatData, async ({ error }: SendChatResponse) => {
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.SEND_CHAT,
          // message: 'Internal Server Error: Please try again.',
        });
      } else {
        onSuccess?.({ action: NamespaceEnum.SEND_CHAT }); // Success callback
      }

      processButtonStatus(false);
    });
  };

  /**
   * Handler for starting game.
   */
  const handleStartGame = () => {
    processButtonStatus(true);

    beforeSubmit?.({ action: NamespaceEnum.START_GAME }); // Execute the beforeSubmit callback before initiating the request

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
      onError?.({ action: NamespaceEnum.START_GAME });
    }, 5000);

    // Send to socket
    socket.emit(NamespaceEnum.START_GAME, room, async ({ error }: { error: Error }) => {
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
        onError?.({
          action: NamespaceEnum.START_GAME,
          message: 'Internal Server Error: Please try again.',
        });
      } else {
        onSuccess?.({ action: NamespaceEnum.START_GAME }); // Success callback
      }

      processButtonStatus(false);
    });
  };

  return {
    handleLogin,
    handleLogout,
    handleCreateRoom,
    handleEditRoom,
    handleJoinRoom,
    handleLeaveRoom,
    handleSendChat,
    handleStartGame,
    loadingButton,
    errorMessage,
    setErrorMessage,
  };
};

/*
In client, use as:

  import {
    useAction,
    type ErrorCallbackFunction,
    type SuccessCallbackFunction,
  } from '@/hooks';

  const onError: ErrorCallbackFunction = (error) => {
    // setErrorMessage(error);
  };

  const onSuccess: SuccessCallbackFunction = (data) => {
    console.log('Operation successful. Data:', data);
  };

  const { ..., loadingButton } = useAction({
    onError,
    onSuccess,
  });
*/
