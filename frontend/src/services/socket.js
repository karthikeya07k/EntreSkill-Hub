import { io } from "socket.io-client";

let socket = null;
let currentToken = null;

export const connectSocket = (token) => {
  if (!token) {
    return null;
  }

  if (socket && currentToken === token) {
    if (!socket.connected) {
      socket.connect();
    }
    return socket;
  }

  if (socket) {
    socket.disconnect();
  }

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
    auth: { token },
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    timeout: 20000
  });
  currentToken = token;

  return socket;
};

export const getSocket = () => socket;
export const isSocketConnected = () => Boolean(socket?.connected);

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    currentToken = null;
  }
};
