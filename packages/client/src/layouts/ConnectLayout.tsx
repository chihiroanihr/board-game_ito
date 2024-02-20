import React, { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";

import Loader from "../components/Loader";

import { useSession } from "../hooks/useSession";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { useSocket } from "../hooks/useSocket";
import {
  navigateHome,
  navigateDashboard,
  navigateWaiting,
  outputServerError,
} from "../utils";

import { User, Room } from "@board-game-ito/shared";

// type SessionIdType = string | null;
// type UserDataType = User | null;
// type RoomDataType = Room | null;

// type LocalStorageSessionType = {
//   sessionId: SessionIdType,
//   user: UserDataType,
//   room: RoomDataType,
// };

type SocketEventType = {
  sessionId: string;
  user: User | null;
  room: Room | null;
};

export default function ConnectLayout() {
  const navigate = useNavigate();

  const { socket } = useSocket();

  // Retrieve local storage values
  const { sessionId, updateSession, discardSession } = useSession();
  const { user, discardUser, updateUser } = useAuth();
  const { room, discardRoom, updateRoom } = useRoom();

  const [sessionDataFetched, setSessionDataFetched] = useState<boolean>(false);
  const [connectionTimeout, setConnectionTimeout] = useState<boolean>(false);

  // ========== Initial Connect | Browser Refreshed ========== //

  // [1] Connect attempt: Send session ID if exists
  useEffect(() => {
    // Set a timeout for the connection attempt
    const timeoutId = setTimeout(() => {
      setConnectionTimeout(true);
    }, 10000); // 10 seconds

    const onConnect = () => {
      clearTimeout(timeoutId); // Cleanup the timeout if the connection is established before the timeout
    };

    // If session ID exists, then attach the session ID to the next reconnection attempts
    socket.auth = sessionId ? { sessionId } : {};

    // Connect to socket server (No-op if the socket is already connected)
    socket.connect();

    // Handshake connection success
    socket.on("connect", onConnect);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      clearTimeout(timeoutId);
      socket.off("connect", onConnect);
      socket.disconnect();
    };
  }, [sessionId, socket]);

  // [2] Receive response (session ID) from socket server
  /**
   * 1. If client initially had session ID and server saved it in database, server will return the same session ID.
   * 2. If client didn't have session ID or server could not find same session ID from the database, server will return the newly generated session ID.
   */
  useEffect(() => {
    function onSessionEvent({ sessionId, user, room }: SocketEventType) {
      // Attach the session ID to the next reconnection attempts
      socket.auth = { sessionId };

      // Store it in the localStorage
      updateSession(sessionId);
      updateUser(user);
      updateRoom(room);

      setSessionDataFetched(true);
    }

    // Receive
    socket.on("session", onSessionEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("session", onSessionEvent);
    };
  }, [room, updateSession, socket, updateRoom, updateUser, user]);

  // Connection error handling
  /**
   * The connect_error event will be emitted upon connection failure:
   * 1. due to the low-level errors (when the server is down for example)
   * 2. due to middleware errors
   */
  useEffect(() => {
    function onErrorEvent(error: any) {
      console.log(error);
      outputServerError({ error });
    }

    // Receive
    socket.on("server-error", onErrorEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("server-error", onErrorEvent);
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
      updateSession(sessionId);
      updateUser(user);
      updateRoom(room);
    };

    // Listen for event: when local storage (manually) changes
    window.addEventListener("storage", checkLocalStorage);

    return () => {
      window.removeEventListener("storage", checkLocalStorage);
    };
  }, [
    discardSession,
    discardRoom,
    room,
    updateSession,
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