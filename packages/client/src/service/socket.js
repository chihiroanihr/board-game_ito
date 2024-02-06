import io from "socket.io-client";

const SOCKET_URL = "192.168.1.150:3001";

export const socket = io(SOCKET_URL);
