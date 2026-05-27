import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../types/index.js';
import { paginate } from '../utils/helpers.js';
import { emitToConversation, emitToUser } from '../socket/index.js';

export const createOrGetConversation = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { sellerId, productId } = req.body as {
      sellerId?: string;
      productId?: string;
    };

    if (!sellerId) {
      return res.status(400).json({ error: 'sellerId is required' });
    }

    if (userId === sellerId) {
      return res.status(400).json({ error: 'Cannot create conversation with yourself' });
    }

    const seller = await prisma.user.findUnique({
      where: { id: sellerId },
      select: { id: true },
    });

    if (!seller) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    if (productId) {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { id: true },
      });

      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        buyerId: productId ? undefined : userId,
        sellerId: productId ? undefined : sellerId,
        ...(productId
          ? { OR: [{ buyerId: userId, sellerId, productId }] }
          : { buyerId: userId, sellerId, productId: null }),
      },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        seller: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true, thumbnail: true },
            },
          },
        },
      },
    });

    if (existingConversation) {
      return res.json({ data: existingConversation });
    }

    const conversation = await prisma.conversation.create({
      data: {
        buyerId: userId,
        sellerId,
        ...(productId ? { productId } : {}),
      },
      include: {
        messages: {
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
          },
        },
        buyer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        seller: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true, thumbnail: true },
            },
          },
        },
      },
    });

    return res.status(201).json({ data: conversation });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const getMyConversations = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ buyerId: userId }, { sellerId: userId }],
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        buyer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        seller: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            listingType: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
              select: { url: true, thumbnail: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, name: true, username: true, avatarUrl: true },
            },
          },
        },
      },
    });

    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        const otherUser = conv.buyerId === userId ? conv.seller : conv.buyer;

        return {
          ...conv,
          unreadCount,
          otherUser,
        };
      })
    );

    return res.json({ data: conversationsWithUnread });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getConversationMessages = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, buyerId: true, sellerId: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { skip, take } = paginate(page, limit);

    const [messages, total] = await Promise.all([
      prisma.message.findMany({
        where: { conversationId: id },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          sender: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.message.count({ where: { conversationId: id } }),
    ]);

    return res.json({
      data: {
        messages: messages.reverse(),
        total,
        page,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    let { content, imageUrl, type } = req.body as {
      content?: string;
      imageUrl?: string;
      type?: 'TEXT' | 'IMAGE';
    };

    if (!type) {
      type = imageUrl ? 'IMAGE' : 'TEXT';
    }

    if (!['TEXT', 'IMAGE'].includes(type)) {
      return res.status(400).json({ error: 'Invalid message type' });
    }

    if (type === 'TEXT' && !content?.trim()) {
      return res.status(400).json({ error: 'Message content is required for text messages' });
    }

    if (type === 'IMAGE' && !imageUrl) {
      return res.status(400).json({ error: 'Image URL is required for image messages' });
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, buyerId: true, sellerId: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    const message = await prisma.message.create({
      data: {
        content: type === 'TEXT' ? content?.trim() : null,
        imageUrl: type === 'IMAGE' ? imageUrl : null,
        type,
        senderId: userId,
        conversationId: id,
      },
      include: {
        sender: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    const receiverId =
      conversation.buyerId === userId ? conversation.sellerId : conversation.buyerId;

    const notification = await prisma.notification.create({
      data: {
        type: 'NEW_MESSAGE',
        title: 'New Message',
        message: content?.trim() || 'Image',
        userId: receiverId,
        data: { conversationId: id, messageId: message.id },
      },
    });

    emitToConversation(id, 'message:new', message);
    emitToUser(receiverId, 'notification:new', notification);

    return res.status(201).json({ data: message });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to send message' });
  }
};

export const markAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({
      where: { id },
      select: { id: true, buyerId: true, sellerId: true },
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.buyerId !== userId && conversation.sellerId !== userId) {
      return res.status(403).json({ error: 'You are not a participant in this conversation' });
    }

    await prisma.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: userId },
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({ data: { success: true } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

export const getUnreadCount = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const count = await prisma.message.count({
      where: {
        senderId: { not: userId },
        isRead: false,
        conversation: {
          OR: [{ buyerId: userId }, { sellerId: userId }],
        },
      },
    });

    return res.json({ data: { count } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch unread count' });
  }
};

export const blockUser = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      data: { message: 'User blocked successfully' },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to block user' });
  }
};

export const reportUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;
    const { reason, description } = req.body as {
      reason?: string;
      description?: string;
    };

    if (!reason?.trim()) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    if (userId === id) {
      return res.status(400).json({ error: 'You cannot report yourself' });
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const report = await prisma.report.create({
      data: {
        reason: reason.trim(),
        description: description?.trim(),
        reporterId: userId,
        reportedId: id,
      },
      include: {
        reporter: {
          select: { id: true, name: true, username: true },
        },
        reported: {
          select: { id: true, name: true, username: true },
        },
      },
    });

    return res.status(201).json({ data: report });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to report user' });
  }
};
