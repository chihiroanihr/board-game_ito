import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  type LoginResponse,
  type LogoutResponse,
  type CreateRoomResponse,
  type JoinRoomResponse,
  type EditRoomResponse,
  type LeaveRoomResponse,
  type RoomSetting,
  type User,
  type Room,
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
import { type LoginFormDataType, type JoinRoomFormDataType } from '../enum';

export type ErrorCallbackParams = { action?: NamespaceEnum; message?: string };
export interface ErrorCallbackFunction {
  (error: ErrorCallbackParams): void;
}

export type SuccessCallbackParams = { action?: NamespaceEnum; user?: User; room?: Room };
export interface SuccessCallbackFunction {
  (data: SuccessCallbackParams): void;
}

interface UseActionCallback {
  onError?: ErrorCallbackFunction;
  onSuccess?: SuccessCallbackFunction;
}

export const useAction = ({ onError, onSuccess }: UseActionCallback) => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user, updateUser, discardUser } = useAuth();
  const { room, updateRoom, discardRoom } = useRoom();
  const { setIsSubmitting } = useSubmissionStatus();

  const [errorMessage, setErrorMessage] = useState<string>('');
  const [loadingButton, setLoadingButton] = useState<boolean | undefined>();

  const processButtonStatus = (status: boolean) => {
    setLoadingButton(status);
    setIsSubmitting(status);
  };

  const handleLogin = (data: LoginFormDataType) => {
    processButtonStatus(true); // Set submitting to true when the request is initiated
    setErrorMessage(''); // Reset error message

    const userName = data.name.trim(); // Trim any start/end spaces
    // [*] ERROR
    if (!userName) {
      setErrorMessage('Please enter a valid name.');
      processButtonStatus(false);
      // onError?.({ action: NamespaceEnum.LOGIN });
      return;
    }

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false); // Set submitting to false when the input error happens
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LOGIN, userName, async ({ error, user }: LoginResponse) => {
      clearTimeout(timeoutId); // Clear the timeout as response is received before timeout

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        // onError?.({
        //     action: NamespaceEnum.LOGIN,
        //     message: 'Internal Server Error: Please try again.',
        //   });
      }
      // [*] SUCCESS
      else {
        updateUser(user ? user : null); // Login and save user info to local storage
        navigateDashboard(navigate); // Navigate
        // onSuccess?.({ action: NamespaceEnum.LOGIN, user: user });
      }

      processButtonStatus(false); // Set submitting to false when the response is received
    });
  };

  const handleLogout = () => {
    processButtonStatus(true);

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LOGOUT, async ({ error }: LogoutResponse) => {
      clearTimeout(timeoutId);

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        // onError?.({
        //     action: NamespaceEnum.LOGOUT,
        //     message: 'Internal Server Error: Please try again.',
        //   });
      }
      // [*] SUCCESS
      else {
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate

        // Callback
        onSuccess?.({ action: NamespaceEnum.LOGOUT });
      }

      processButtonStatus(false);
    });
  };

  const handleCreateRoom = (formData: RoomSetting) => {
    setErrorMessage(''); // Reset error message
    processButtonStatus(true);

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
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
          //   onError?.({
          //       action: NamespaceEnum.CREATE_ROOM,
          //       message: 'Internal Server Error: Please try again.',
          //     });
        }
        // [*] SUCCESS
        else {
          updateUser(user ? user : null); // Store updated user info to local storage
          updateRoom(room ? room : null); // Store room info to local storage and redirect
          navigateWaiting(navigate); // Navigate
          // onSuccess?.({ action: NamespaceEnum.CREATE_ROOM, user, room });
        }

        processButtonStatus(false);
      }
    );
  };

  const handleJoinRoom = (data: JoinRoomFormDataType) => {
    setErrorMessage(''); // Reset error message
    processButtonStatus(true);

    const roomId = data.roomId.trim().toUpperCase();
    // [*] ERROR
    if (!roomId) {
      processButtonStatus(false);
      setErrorMessage('Please enter a valid Room ID.');
      //   onError?.({ action: NamespaceEnum.JOIN_ROOM, message: 'Please enter a valid Room ID.' });
      return;
    }

    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
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
          //   onError?.({
          //       action: NamespaceEnum.JOIN_ROOM,
          //       message: 'Internal Server Error: Please try again.',
          //     });
        } else {
          // [*] SUCCESS: User can join room
          if (typeof room === 'object') {
            updateUser(user ? user : null); // Store updated user info to local storage
            updateRoom(room ? room : null); // Save room info to local storage and navigate
            navigateWaiting(navigate); // Navigate
            // onSuccess?.({ action: NamespaceEnum.JOIN_ROOM, user, room });
          }
          // [*] ERROR: User cannot join room
          else {
            const unavailableMsg = room; // room is now string message
            setErrorMessage(unavailableMsg || 'You cannot join this room for unknown reason.');
            // onError?.({
            //     action: NamespaceEnum.JOIN_ROOM,
            //     message: unavailableMsg || 'You cannot join this room for unknown reason.',
            //   });
          }
        }

        processButtonStatus(false);
      }
    );
  };

  const handleEditRoom = (formData: RoomSetting) => {
    processButtonStatus(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.EDIT_ROOM, formData, async ({ error, room }: EditRoomResponse) => {
      clearTimeout(timeoutId);

      // [*] ERROR
      if (error) {
        outputServerError({ error });
        // onError?.({
        //     action: NamespaceEnum.EDIT_ROOM,
        //     message: 'Internal Server Error: Please try again.',
        //   });
      }
      // [*] SUCCESS
      else {
        updateRoom(room ? room : null); // Update room info to local storage
        onSuccess?.({ action: NamespaceEnum.EDIT_ROOM }); // Callback
      }

      processButtonStatus(false);
    });
  };

  const handleLeaveRoom = () => {
    processButtonStatus(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit(NamespaceEnum.LEAVE_ROOM, async ({ error }: LeaveRoomResponse) => {
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
        // onError?.({
        //     action: NamespaceEnum.LEAVE_ROOM,
        //     message: 'Internal Server Error: Please try again.',
        //   });
      } else {
        discardRoom();
        navigateDashboard(navigate);

        // Callback
        onSuccess?.({ action: NamespaceEnum.LEAVE_ROOM });
      }

      processButtonStatus(false);
    });
  };

  const handleStartGame = () => {
    processButtonStatus(true);

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      processButtonStatus(false);
      outputResponseTimeoutError();
    }, 5000);

    // Send to socket
    socket.emit(NamespaceEnum.START_GAME, room, async ({ error }: { error: Error }) => {
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
        //   onError?.({
        //     action: NamespaceEnum.START_GAME,
        //     message: 'Internal Server Error: Please try again.',
        //   });
      } else {
        // Navigate to start game
        // onSuccess?.({ action: NamespaceEnum.START_GAME });
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
