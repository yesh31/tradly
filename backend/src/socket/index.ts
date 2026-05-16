import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/helpers.js';
import { prisma } from '../utils/prisma.js';
import { config } from '../config/index.js';

let io: Server;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export const initializeSocket = (httpServer: HttpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 10000,
    pingTimeout: 5000,
  });

  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      if (token) {
        const decoded = verifyToken(token as string);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
        if (user && !user.isBanned) {
          socket.userId = decoded.userId;
        }
      }
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const userId = socket.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User connected: ${userId}`);
    }

    // Join conversation room
    socket.on('conversation:join', (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on('typing:start', ({ conversationId, userId: typingUserId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', {
        conversationId,
        userId: typingUserId,
      });
    });

    socket.on('typing:stop', ({ conversationId, userId: typingUserId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', {
        conversationId,
        userId: typingUserId,
      });
    });

    // Real-time new message
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type } = data;
        const message = await prisma.message.create({
          data: {
            content,
            type: type || 'TEXT',
            senderId: userId!,
            conversationId,
          },
          include: {
            sender: { select: { id: true, name: true, avatarUrl: true } },
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        io.to(`conversation:${conversationId}`).emit('message:new', message);

        // Send notification to the other participant
        const conversation = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });
        if (conversation) {
          const otherUserId = conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;
          io.to(`user:${otherUserId}`).emit('notification:new', {
            type: 'NEW_MESSAGE',
            title: 'New Message',
            message: `You have a new message`,
            data: { conversationId },
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Real-time bid placement
    socket.on('bid:place', async (data) => {
      try {
        const { productId, amount } = data;
        const product = await prisma.product.findUnique({
          where: { id: productId },
          include: { bids: { orderBy: { amount: 'desc' }, take: 1 } },
        });

        if (!product || product.listingType !== 'AUCTION') {
          socket.emit('error', { message: 'Invalid auction product' });
          return;
        }

        if (product.auctionEnd && new Date() > product.auctionEnd) {
          socket.emit('error', { message: 'Auction has ended' });
          return;
        }

        const highestBid = product.bids[0];
        const minBid = highestBid
          ? highestBid.amount + (product.minBidIncrement || 1)
          : product.startingBid || 0;

        if (amount < minBid) {
          socket.emit('error', { message: `Minimum bid is $${minBid}` });
          return;
        }

        const bid = await prisma.bid.create({
          data: { amount, userId: userId!, productId },
          include: { user: { select: { id: true, name: true, avatarUrl: true } } },
        });

        io.to(`product:${productId}`).emit('bid:new', bid);
        io.to(`user:${product.userId}`).emit('notification:new', {
          type: 'BID_RECEIVED',
          title: 'New Bid',
          message: `A new bid of $${amount} was placed on ${product.title}`,
          data: { productId, bidId: bid.id },
        });

        // Notify outbid user
        if (highestBid && highestBid.userId !== userId) {
          io.to(`user:${highestBid.userId}`).emit('notification:new', {
            type: 'BID_OUTBID',
            title: 'You\'ve Been Outbid',
            message: `Someone placed a higher bid of $${amount} on ${product.title}`,
            data: { productId },
          });
        }
      } catch (error) {
        socket.emit('error', { message: 'Failed to place bid' });
      }
    });

    // Join product room for bid updates
    socket.on('product:join', (productId: string) => {
      socket.join(`product:${productId}`);
    });

    socket.on('product:leave', (productId: string) => {
      socket.leave(`product:${productId}`);
    });

    socket.on('disconnect', () => {
      if (userId) {
        console.log(`User disconnected: ${userId}`);
      }
    });
  });

  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

export const emitToProduct = (productId: string, event: string, data: any) => {
  if (io) {
    io.to(`product:${productId}`).emit(event, data);
  }
};

export const emitToConversation = (conversationId: string, event: string, data: any) => {
  if (io) {
    io.to(`conversation:${conversationId}`).emit(event, data);
  }
};
