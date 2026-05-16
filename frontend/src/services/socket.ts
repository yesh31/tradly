import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;

export const connect = (token: string): Socket => {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  socket.connect();
  return socket;
};

export const disconnect = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = (): Socket | null => socket;

export const onMessage = (callback: (data: unknown) => void): void => {
  socket?.on('message:received', callback);
};

export const onBid = (callback: (data: unknown) => void): void => {
  socket?.on('bid:received', callback);
};

export const onNotification = (callback: (data: unknown) => void): void => {
  socket?.on('notification:received', callback);
};

export const onTypingStart = (callback: (data: unknown) => void): void => {
  socket?.on('typing:start', callback);
};

export const onTypingStop = (callback: (data: unknown) => void): void => {
  socket?.on('typing:stop', callback);
};

export const joinConversation = (conversationId: string): void => {
  socket?.emit('conversation:join', { conversationId });
};

export const leaveConversation = (conversationId: string): void => {
  socket?.emit('conversation:leave', { conversationId });
};

export const sendMessage = (data: {
  conversationId: string;
  content?: string;
  imageUrl?: string;
}): void => {
  socket?.emit('message:send', data);
};

export const placeBid = (data: { productId: string; amount: number }): void => {
  socket?.emit('bid:place', data);
};

export const joinProduct = (productId: string): void => {
  socket?.emit('product:join', { productId });
};

export const leaveProduct = (productId: string): void => {
  socket?.emit('product:leave', { productId });
};

export const startTyping = (data: { conversationId: string }): void => {
  socket?.emit('typing:start', data);
};

export const stopTyping = (data: { conversationId: string }): void => {
  socket?.emit('typing:stop', data);
};
