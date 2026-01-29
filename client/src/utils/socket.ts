import { io, Socket } from 'socket.io-client';

// Determine socket URL based on environment
const getSocketURL = () => {
  // If running on production domain, use production URL
  if (window.location.hostname === 'pos.universalbozor.uz') {
    return 'https://pos.universalbozor.uz';
  }
  // Otherwise use localhost with correct port
  return 'http://localhost:5050';
};

const SOCKET_URL = getSocketURL();

let socket: Socket | null = null;

export const initSocket = () => {
  if (!socket) {
    console.log('🔌 Creating new socket connection to:', SOCKET_URL);
    socket = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket?.id);
    });

    socket.on('disconnect', () => {
      console.log('🔌 Socket disconnected');
    });

    socket.on('connect_error', (error: Error) => {
      console.error('🔌 Socket connection error:', error);
    });
  } else {
    console.log('🔌 Reusing existing socket connection:', socket.id);
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

// Export socket directly for convenience (will be null until initSocket is called)
export { socket };
