import { io, Socket } from 'socket.io-client';

async function getPublicIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Failed to get public IP:', error);
    return undefined;
  }
}

async function initializeSocket(): Promise<Socket> {
  const SOCKET_URL = `${import.meta.env.VITE_SERVER_HOST_URL}:${import.meta.env.VITE_SERVER_PORT}`;
  // const SOCKET_URL = `${window.location.hostname}:${import.meta.env.VITE_SERVER_PORT}`;

  // const hostIP = await getPublicIP();
  // const SOCKET_URL = `${hostIP}:${import.meta.env.VITE_SERVER_PORT}`;

  const socketOptions = {
    autoConnect: false, // The autoConnect is set to false so the connection is not established right away.
    // reconnection: true,
    // reconnectionDelay: 1000,
    // reconnectionAttempts: 10,
  };

  const socket: Socket = io(SOCKET_URL, socketOptions);

  // Catch-all listener
  if (import.meta.env.NODE_ENV !== 'production') {
    socket.onAny((event: string, ...args: unknown[]) => {
      console.log(event, args); // Any event received by the client will be printed in the console.
    });
  }

  return socket;
}

export const socket = await initializeSocket();
