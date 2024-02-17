import { useEffect } from "react";
import { useOutlet, useNavigate } from "react-router-dom";

import LazyComponentWrapper from "../components/LazyComponentWrapper";

import { useSession } from "../hooks/useSession";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { SocketProvider } from "../hooks/useSocket";
import { socket } from "../service/socket";
import {
  navigateHome,
  navigateDashboard,
  navigateWaiting,
  outputServerError,
} from "../utils";

/** @debug - Display amount of sockets connected: Only for development environment */
const socketsConnectedComponent = () =>
  import("../components/debug/SocketsConnected").then(
    (module) => module.default
  );

/** @debug - Display amount of sockets logged-in: Only for development environment */
const socketsLoggedInComponent = () =>
  import("../components/debug/SocketsLoggedIn").then(
    (module) => module.default
  );

export default function ConnectLayout() {
  const outlet = useOutlet();
  const navigate = useNavigate();

  const { session, saveSession, discardSession } = useSession();
  const { user, logout, updateUser } = useAuth();
  const { room, leaveRoom, updateRoom } = useRoom();

  // ========== Prevent Navigating without User Information ========== //

  useEffect(() => {
    // If user is not logged in, redirect to the home page.
    if (!user) {
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
  }, [navigate, room, user]);

  // ================ Local Storage Manually Modified ================ //

  // Check local storage
  useEffect(() => {
    const checkLocalStorage = () => {
      // Unless these values exists previously
      if (!session) {
        updateRoom(null); // leave room
        updateUser(null); // then logout
        discardSession(); // then discard session
      } else if (!user) {
        updateRoom(null);
        logout();
      } else if (!room) {
        leaveRoom();
      }

      // Restore local storage value when deleted manually
      saveSession(session);
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
    leaveRoom,
    logout,
    room,
    saveSession,
    session,
    updateRoom,
    updateUser,
    user,
  ]);

  // ========== Initial Connect | Browser Refreshed ========== //

  // [1] Connect attempt: Send session ID if exists
  useEffect(() => {
    // Retrieve session ID
    let sessionId = localStorage.getItem("session");
    sessionId =
      !sessionId || sessionId === "null" ? null : JSON.parse(sessionId);

    // If session ID exists, then attach the session ID to the next reconnection attempts
    socket.auth = sessionId ? { sessionId } : {};

    // Connect to socket server (No-op if the socket is already connected)
    socket.connect();

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  // [2] Receive response (session ID) from socket server
  /**
   * 1. If client initially had session ID and server saved it in database, server will return the same session ID.
   * 2. If client didn't have session ID or server could not find same session ID from the database, server will return the newly generated session ID.
   */
  useEffect(() => {
    function onSessionEvent({ sessionId }) {
      // Attach the session ID to the next reconnection attempts
      socket.auth = { sessionId };

      // Store it in the localStorage
      saveSession(sessionId);
      updateUser(user);
      updateRoom(room);
    }

    // Receive
    socket.on("session", onSessionEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("session", onSessionEvent);
    };
  }, [room, saveSession, updateRoom, updateUser, user]);

  // Connection error handling
  /**
   * The connect_error event will be emitted upon connection failure:
   * 1. due to the low-level errors (when the server is down for example)
   * 2. due to middleware errors
   */
  useEffect(() => {
    function onErrorEvent(error) {
      outputServerError({ error });
    }

    // Receive
    socket.on("error", onErrorEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("error", onErrorEvent);
    };
  }, []);

  return (
    <SocketProvider socket={socket}>
      <header>{/* Navigation */}</header>

      <main>
        {outlet}

        {process.env.NODE_ENV !== "production" && (
          <>
            <hr />
            <LazyComponentWrapper loadComponent={socketsConnectedComponent} />
            <LazyComponentWrapper loadComponent={socketsLoggedInComponent} />
            <hr />
          </>
        )}
      </main>

      <footer>Footer Content</footer>
    </SocketProvider>
  );
}
