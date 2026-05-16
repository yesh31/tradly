import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest, BidPayload } from '../types/index.js';
import { paginate } from '../utils/helpers.js';

export const placeBid = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { amount, productId } = req.body as BidPayload;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Bid amount must be greater than 0' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { user: { select: { id: true } } },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.listingType !== 'AUCTION') {
      return res.status(400).json({ error: 'This product is not an auction' });
    }

    if (product.status === 'SOLD') {
      return res.status(400).json({ error: 'This product has already been sold' });
    }

    if (product.auctionEnd && new Date() > product.auctionEnd) {
      return res.status(400).json({ error: 'This auction has ended' });
    }

    if (product.userId === userId) {
      return res.status(400).json({ error: 'You cannot bid on your own product' });
    }

    const highestBid = await prisma.bid.findFirst({
      where: { productId },
      orderBy: { amount: 'desc' },
    });

    if (!highestBid) {
      if (!product.startingBid || amount < product.startingBid) {
        return res.status(400).json({
          error: `Bid must be at least ${product.startingBid}`,
        });
      }
    } else {
      const increment = product.minBidIncrement ?? 0;
      const minimumAmount = highestBid.amount + increment;
      if (amount <= minimumAmount) {
        return res.status(400).json({
          error: `Bid must be greater than ${minimumAmount}`,
        });
      }
    }

    const bid = await prisma.bid.create({
      data: { amount, userId, productId },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: 'BID_RECEIVED',
        title: 'New Bid',
        message: `You received a bid of $${amount} on "${product.title}"`,
        userId: product.userId,
        data: { productId, bidId: bid.id, amount },
      },
    });

    if (highestBid && highestBid.userId !== userId) {
      await prisma.notification.create({
        data: {
          type: 'BID_OUTBID',
          title: 'You\'ve Been Outbid',
          message: `Someone placed a higher bid of $${amount} on "${product.title}"`,
          userId: highestBid.userId,
          data: { productId, newBidId: bid.id, amount },
        },
      });
    }

    return res.status(201).json({ data: bid });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to place bid' });
  }
};

export const getProductBids = async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const bids = await prisma.bid.findMany({
      where: { productId },
      orderBy: { amount: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    return res.json({ data: bids });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch bids' });
  }
};

export const getMyBids = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { skip, take } = paginate(page, limit);

    const [bids, total] = await Promise.all([
      prisma.bid.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          product: {
            include: {
              images: {
                orderBy: { order: 'asc' },
                take: 1,
                select: { id: true, url: true, thumbnail: true },
              },
            },
          },
        },
      }),
      prisma.bid.count({ where: { userId } }),
    ]);

    return res.json({
      data: { bids, total, page, totalPages: Math.ceil(total / take) },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch your bids' });
  }
};

export const acceptBid = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, userId: true, title: true, status: true },
        },
      },
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.product.userId !== userId) {
      return res.status(403).json({ error: 'Only the product owner can accept bids' });
    }

    if (bid.product.status === 'SOLD') {
      return res.status(400).json({ error: 'This product has already been sold' });
    }

    if (bid.isWinner) {
      return res.status(400).json({ error: 'This bid has already been accepted' });
    }

    const [updatedBid] = await Promise.all([
      prisma.bid.update({
        where: { id },
        data: { isWinner: true },
        include: {
          user: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
        },
      }),
      prisma.product.update({
        where: { id: bid.productId },
        data: { status: 'SOLD' },
      }),
      prisma.notification.create({
        data: {
          type: 'AUCTION_WON',
          title: 'You Won the Auction!',
          message: `Congratulations! You won the auction for "${bid.product.title}"`,
          userId: bid.userId,
          data: { productId: bid.productId, bidId: bid.id, amount: bid.amount },
        },
      }),
    ]);

    return res.json({ data: updatedBid });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to accept bid' });
  }
};

export const rejectBid = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { id } = req.params;

    const bid = await prisma.bid.findUnique({
      where: { id },
      include: {
        product: {
          select: { id: true, userId: true, title: true },
        },
      },
    });

    if (!bid) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    if (bid.product.userId !== userId) {
      return res.status(403).json({ error: 'Only the product owner can reject bids' });
    }

    if (bid.isWinner) {
      return res.status(400).json({ error: 'Cannot reject a bid that has already been accepted' });
    }

    const updatedBid = await prisma.bid.update({
      where: { id },
      data: { isWinner: false },
      include: {
        user: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    await prisma.notification.create({
      data: {
        type: 'SYSTEM',
        title: 'Bid Rejected',
        message: `Your bid of $${bid.amount} on "${bid.product.title}" was rejected`,
        userId: bid.userId,
        data: { productId: bid.productId, bidId: bid.id },
      },
    });

    return res.json({ data: updatedBid });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to reject bid' });
  }
};
