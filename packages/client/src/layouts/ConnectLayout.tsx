import React, { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { type SessionResponse, NamespaceEnum } from '@bgi/shared';

import { Loader } from '@/components';
import { useSession, useAuth, useRoom, useSocket } from '@/hooks';
import { navigateHome, navigateDashboard, navigateWaiting, outputServerError } from '@/utils';

export default function ConnectLayout() {
  const navigate = useNavigate();

  const { socket } = useSocket();

  // Retrieve local storage values
  const { sessionId, updateSessionId, discardSessionId } = useSession();
  const { user, discardUser, updateUser } = useAuth();
  const { room, discardRoom, updateRoom } = useRoom();

  const [sessionDataFetched, setSessionDataFetched] = useState<boolean>(false);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(false);

  // ========== Initial Connect | Browser Refreshed ========== //

  // If session ID exists, then attach the session ID to the next reconnection attempts
  socket.auth = sessionId ? { sessionId } : {};

  // [1] Connect attempt: Send session ID if exists
  useEffect(() => {
    // Set a timeout for the connection attempt
    const timeoutId = setTimeout(() => {
      setConnectionTimeout(true); // Connection error
    }, 10000); // 10 seconds

    const onConnect = () => {
      clearTimeout(timeoutId); // Cleanup the timeout if the connection is established before the timeout
    };

    // Connect to socket server (No-op if the socket is already connected)
    socket.connect();

    // Handshake connection success
    socket.on(NamespaceEnum.CONNECT, onConnect);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      clearTimeout(timeoutId);
      socket.off(NamespaceEnum.CONNECT, onConnect);
      socket.disconnect();
    };
  }, [socket]);

  // [2] Receive response (session ID) from socket server
  /**
   * 1. If client initially had session ID and server saved it in database, server will return the same session ID.
   * 2. If client didn't have session ID or server could not find same session ID from the database, server will return the newly generated session ID.
   */
  useEffect(() => {
    function onSessionEvent({ sessionId, user, room }: SessionResponse) {
      // Attach the session ID to the next reconnection attempts
      socket.auth = { sessionId };

      // Store it in the localStorage
      updateSessionId(sessionId);
      updateUser(user);
      updateRoom(room);

      setSessionDataFetched(true);
    }

    // Receive
    socket.on(NamespaceEnum.SESSION, onSessionEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off(NamespaceEnum.SESSION, onSessionEvent);
    };
  }, [room, updateSessionId, socket, updateRoom, updateUser, user]);

  // Connection error handling
  /**
   * The connect_error event will be emitted upon connection failure:
   * 1. due to the low-level errors (when the server is down for example)
   * 2. due to middleware errors
   */
  useEffect(() => {
    function onErrorEvent(error: unknown) {
      outputServerError({ error });
    }

    // Receive
    socket.on('error', onErrorEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('error', onErrorEvent);
    };
  }, [socket]);

  // ========== Prevent Navigating without User Information ========== //

  useEffect(() => {
    // If user is not logged in, redirect to the home page.
    if (!sessionId || !user) {
      room && discardRoom(); // leave room
      user && discardUser(); // logout
      navigateHome(navigate);
    }
    // If user is logged in but not part of a room, redirect to the dashboard.
    else if (!room) {
      navigateDashboard(navigate);
    }
    // If user is logged in and part of a room, redirect to the waiting page.
    else {
      navigateWaiting(navigate);
    }
  }, [discardRoom, discardUser, navigate, room, sessionId, user]);

  // ================ Local Storage Manually Modified ================ //

  // Check local storage
  useEffect(() => {
    const checkLocalStorage = () => {
      // Restore local storage value when deleted manually
      updateSessionId(sessionId);
      updateUser(user);
      updateRoom(room);
    };

    // Listen for event: when local storage (manually) changes
    window.addEventListener('storage', checkLocalStorage);

    return () => {
      window.removeEventListener('storage', checkLocalStorage);
    };
  }, [
    discardSessionId,
    discardRoom,
    room,
    updateSessionId,
    sessionId,
    updateRoom,
    updateUser,
    user,
    discardUser,
    navigate,
  ]);

  return !sessionDataFetched ? (
    connectionTimeout ? (
      /** @todo - (navigate to) Error Component */
      <div>Error</div>
    ) : (
      <Loader />
    )
  ) : (
    <Outlet />
  );
}
