import React, { useEffect, useState } from 'react';

import { useSocket } from '../../hooks/useSocket';

const SocketsLoggedIn = () => {
  const { socket } = useSocket();

  const [socketsUpdated, setSocketsUpdated] = useState<string[]>([]);
  const [socketLoggedIn, setSocketLoggedIn] = useState<string>();
  const [socketLoggedOut, setSocketLoggedOut] = useState<string>();

  useEffect(() => {
    async function onSocketsUpdateEvent(data: string[]) {
      setSocketsUpdated(data);
    }

    socket.on('sockets-loggedin', onSocketsUpdateEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('sockets-loggedin', onSocketsUpdateEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onNewSocketEvent(data: string) {
      setSocketLoggedIn(data);

      // Clear the logged-in message after few seconds
      setTimeout(() => setSocketLoggedIn(undefined), 3000);
    }

    socket.on('socket-loggedin', onNewSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('socket-loggedin', onNewSocketEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onRemoveSocketEvent(data: string) {
      setSocketLoggedOut(data);

      // Clear the logged-out message after few seconds
      setTimeout(() => setSocketLoggedOut(undefined), 3000);
    }

    socket.on('socket-loggedout', onRemoveSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('socket-loggedout', onRemoveSocketEvent);
    };
  }, [socket]);

  return (
    <div>
      <h2>Users Currently Logged in</h2>

      <div>
        {socketsUpdated && (
          <ul>
            {socketsUpdated.map((socket) => (
              <li key={socket}>{socket}</li>
            ))}
          </ul>
        )}

        {socketLoggedIn && <p>[+] {socketLoggedIn} just logged-in.</p>}

        {socketLoggedOut && <p>[-] {socketLoggedOut} just logged-out.</p>}
      </div>
    </div>
  );
};

export default SocketsLoggedIn;
