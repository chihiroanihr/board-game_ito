import React, { useState } from 'react';
import { useOutlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useRoom } from '../hooks/useRoom';
import { useSocket } from '../hooks/useSocket';
import {
  navigateHome,
  navigateDashboard,
  outputServerError,
  outputResponseTimeoutError
} from '../utils';

/**
 * Layout for Dashboard
 * @returns
 */
export default function DashboardLayout() {
  const outlet = useOutlet();
  const navigate = useNavigate();

  const { socket } = useSocket();
  const { user, discardUser } = useAuth();
  const { room, discardRoom } = useRoom();

  const [loading, setLoading] = useState<boolean>(false);

  const handleLogout = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('logout', async (error: any) => {
      // socket.emit("logout");

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        room && discardRoom();
        user && discardUser();
        navigateHome(navigate); // navigate
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  // useEffect(() => {
  //   function onLogoutSuccessEvent(data) {
  //     try {
  //       room && discardRoom();
  //       user && discardUser();
  //       navigateHome(navigate); // navigate
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("logout_success", onLogoutSuccessEvent);

  //   return () => {
  //     socket.off("logout_success", onLogoutSuccessEvent);
  //   };
  // }, [discardRoom, discardUser, navigate, socket]);

  // useEffect(() => {
  //   function onLogoutErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("logout_error", onLogoutErrorEvent);

  //   return () => {
  //     socket.off("logout_error", onLogoutErrorEvent);
  //   };
  // });

  const handleLeaveRoom = () => {
    setLoading(true); // Set loading to true when the request is initiated

    // Create a timeout to check if the response is received
    const timeoutId = setTimeout(() => {
      setLoading(false);
      outputResponseTimeoutError();
    }, 5000);

    /** @socket_send - Send to socket & receive response */
    socket.emit('leave-room', async (error: any) => {
      // socket.emit("leave-room");

      // Clear the timeout as response is received before timeout
      clearTimeout(timeoutId);

      if (error) {
        outputServerError({ error });
      } else {
        discardRoom();
        navigateDashboard(navigate);
      }

      setLoading(false); // Set loading to false when the response is received
    });
  };

  // const handleLeaveRoom = () => {
  //   // Send to socket
  //   socket.emit("leave-room", user);
  // };

  // useEffect(() => {
  //   async function onLeaveRoomSuccessEvent(data) {
  //     try {
  //       discardRoom();
  //       navigateDashboard(navigate);
  //     } catch (error) {
  //       outputServerError({ error });
  //     }
  //   }

  //   socket.on("leave-room_success", onLeaveRoomSuccessEvent);

  //   return () => {
  //     socket.off("leave-room_success", onLeaveRoomSuccessEvent);
  //   };
  // }, [discardRoom, navigate, socket]);

  // useEffect(() => {
  //   async function onLeaveRoomErrorEvent(error) {
  //     outputServerError({ error });
  //   }

  //   socket.on("leave-room_error", onLeaveRoomErrorEvent);

  //   return () => {
  //     socket.off("leave-room_error", onLeaveRoomErrorEvent);
  //   };
  // }, [discardRoom, navigate, socket]);

  if (!user) return null;
  return (
    <>
      <div>
        <h2>Hello, {user.name}</h2>

        <button onClick={handleLogout} disabled={loading}>
          {loading ? 'Loading...' : 'Leave Game'}
        </button>

        {room && (
          <button onClick={handleLeaveRoom} disabled={loading}>
            {loading ? 'Loading...' : 'Leave Room'}
          </button>
        )}
      </div>

      <div>{outlet}</div>
    </>
  );
}
