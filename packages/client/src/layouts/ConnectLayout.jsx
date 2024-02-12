import { useEffect } from "react";
import { useOutlet } from "react-router-dom";

import { useSession } from "../hooks/useSession";
import { useAuth } from "../hooks/useAuth";
import { useRoom } from "../hooks/useRoom";
import { SocketProvider } from "../hooks/useSocket";
import { socket } from "../service/socket";

/** @debug */
import SocketsConnected from "../debug/SocketsConnected";
import SocketsLoggedIn from "../debug/SocketsLoggedIn";

export default function ConnectLayout() {
  const outlet = useOutlet();

  const { session, saveSession, discardSession } = useSession();
  const { user, logout } = useAuth();
  const { room, leave } = useRoom();

  // Check local storage
  useEffect(() => {
    const checkLocalStorage = async () => {
      const storedSession = window.localStorage.getItem("session");
      const storedUser = window.localStorage.getItem("user");
      const storedRoom = window.localStorage.getItem("room");

      if (!storedSession || !session) {
        await leave(); // leave room
        await logout(); // then logout
        await discardSession();
      } else if (!storedUser || !user) {
        await leave();
        await logout();
      } else if (!storedRoom || !room) {
        await leave();
      }
    };

    window.addEventListener("storage", checkLocalStorage);

    return () => {
      window.removeEventListener("storage", checkLocalStorage);
    };
  }, [user, room, logout, leave, session, discardSession]);

  useEffect(() => {
    // Retrieve session ID if browser refreshed / lost
    const sessionId = localStorage.getItem("session");
    // If session ID exists
    if (sessionId) {
      // Attach the session ID to the next reconnection attempts
      socket.auth = { sessionId };
    }

    // No-op if the socket is already connected
    socket.connect();

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    async function onSessionEvent({ sessionId }) {
      // Attach the session ID to the next reconnection attempts
      socket.auth = { sessionId };
      // Store it in the localStorage
      await saveSession(sessionId);
    }

    // Receive
    socket.on("session", onSessionEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("session", onSessionEvent);
    };
  });

  useEffect(() => {
    // The connect_error event will be emitted upon connection failure:
    // 1. due to the low-level errors (when the server is down for example)
    // 2. due to middleware errors
    function onErrorEvent(error) {
      /** @todo - Display error in view */
      console.log(error);
    }

    // Receive
    socket.on("connect_error", onErrorEvent);

    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off("connect_error", onErrorEvent);
    };
  }, []);

  return (
    <SocketProvider socket={socket}>
      {outlet}
      <SocketsConnected />
      <SocketsLoggedIn />
    </SocketProvider>
  );
}
