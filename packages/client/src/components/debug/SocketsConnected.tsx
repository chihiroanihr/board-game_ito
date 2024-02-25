import React, { useEffect, useState } from 'react';

import { useSocket } from '@/hooks';

const SocketsConnected = () => {
  const { socket } = useSocket();

  const [socketsUpdated, setSocketsUpdated] = useState<string[]>([]);
  const [socketConnected, setSocketConnected] = useState<string>();
  const [socketDisconnected, setSocketDisconnected] = useState<string>();

  useEffect(() => {
    async function onSocketsUpdateEvent(data: string[]) {
      setSocketsUpdated(data);
    }

    socket.on('sockets-connected', onSocketsUpdateEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('sockets-connected', onSocketsUpdateEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onNewSocketEvent(data: string) {
      setSocketConnected(data);

      // Clear the connected message after few seconds
      setTimeout(() => setSocketConnected(undefined), 3000);
    }

    socket.on('socket-connected', onNewSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('socket-connected', onNewSocketEvent);
    };
  }, [socket]);

  useEffect(() => {
    async function onRemoveSocketEvent(data: string) {
      setSocketDisconnected(data);

      // Clear the disconnected message after few seconds
      setTimeout(() => setSocketDisconnected(undefined), 3000);
    }

    socket.on('socket-disconnected', onRemoveSocketEvent);
    // Cleanup the socket event listener when the component unmounts
    return () => {
      socket.off('socket-disconnected', onRemoveSocketEvent);
    };
  }, [socket]);

  return (
    <div>
      <h2>Users Currently Connected</h2>

      <div>
        {socketsUpdated && (
          <ul>
            {socketsUpdated.map((socket) => (
              <li key={socket}>{socket}</li>
            ))}
          </ul>
        )}

        {socketConnected && <p>[+] {socketConnected} just connected.</p>}

        {socketDisconnected && <p>[-] {socketDisconnected} just disconnected.</p>}
      </div>
    </div>
  );
};

export default SocketsConnected;
