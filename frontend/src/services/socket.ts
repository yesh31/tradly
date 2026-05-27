import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || '';

let socket: Socket | null = null;
let activeConversationId: string | null = null;
let activeProductId: string | null = null;

// Registry to keep track of active event listeners so they can survive disconnect/reconnect cycles
type SocketEventCallback = (data: any) => void;
const listeners = new Map<string, Set<SocketEventCallback>>();

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

  // Re-attach all registered listeners to the new socket instance
  listeners.forEach((callbacks, event) => {
    callbacks.forEach((callback) => {
      socket?.on(event, callback);
    });
  });

  // Automatically re-join active rooms on reconnection
  socket.on('connect', () => {
    if (activeConversationId) {
      socket?.emit('conversation:join', activeConversationId);
    }
    if (activeProductId) {
      socket?.emit('product:join', activeProductId);
    }
  });

  socket.connect();
  return socket;
};

export const disconnect = (): void => {
  if (socket) {
    // Detach all listeners from the socket to prevent leaks, but keep them in the registry
    listeners.forEach((callbacks, event) => {
      callbacks.forEach((callback) => {
        socket?.off(event, callback);
      });
    });
    socket.disconnect();
    socket = null;
  }
  activeConversationId = null;
  activeProductId = null;
};

export const getSocket = (): Socket | null => socket;

// Robust registration helpers that work even before the socket connection is created
export const on = (event: string, callback: SocketEventCallback): void => {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event)!.add(callback);

  if (socket) {
    socket.on(event, callback);
  }
};

export const off = (event: string, callback: SocketEventCallback): void => {
  const eventListeners = listeners.get(event);
  if (eventListeners) {
    eventListeners.delete(callback);
    if (eventListeners.size === 0) {
      listeners.delete(event);
    }
  }

  if (socket) {
    socket.off(event, callback);
  }
};

// Legacy/wrapper helpers mapped to the corrected event names
export const onMessage = (callback: SocketEventCallback): void => {
  on('message:new', callback);
};

export const onBid = (callback: SocketEventCallback): void => {
  on('bid:new', callback);
};

export const onNotification = (callback: SocketEventCallback): void => {
  on('notification:new', callback);
};

export const onTypingStart = (callback: SocketEventCallback): void => {
  on('typing:start', callback);
};

export const onTypingStop = (callback: SocketEventCallback): void => {
  on('typing:stop', callback);
};

// Emitter helpers with corrected payload shapes and active room tracking
export const joinConversation = (conversationId: string): void => {
  activeConversationId = conversationId;
  socket?.emit('conversation:join', conversationId);
};

export const leaveConversation = (conversationId: string): void => {
  if (activeConversationId === conversationId) {
    activeConversationId = null;
  }
  socket?.emit('conversation:leave', conversationId);
};

export const sendMessage = (data: {
  conversationId: string;
  content?: string;
  imageUrl?: string;
  type?: 'TEXT' | 'IMAGE';
}): void => {
  socket?.emit('message:send', data);
};

export const placeBid = (data: { productId: string; amount: number }): void => {
  socket?.emit('bid:place', data);
};

export const joinProduct = (productId: string): void => {
  activeProductId = productId;
  socket?.emit('product:join', productId);
};

export const leaveProduct = (productId: string): void => {
  if (activeProductId === productId) {
    activeProductId = null;
  }
  socket?.emit('product:leave', productId);
};

export const startTyping = (data: { conversationId: string; userId?: string }): void => {
  socket?.emit('typing:start', data);
};

export const stopTyping = (data: { conversationId: string; userId?: string }): void => {
  socket?.emit('typing:stop', data);
};
