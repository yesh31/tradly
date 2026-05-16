import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../types/index.js';
import { Response } from 'express';

const router = Router();

router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.watchlist.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { order: 'asc' } },
            user: { select: { id: true, name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json({ data: items });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch watchlist' });
  }
});

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { productId } = req.body;
    const existing = await prisma.watchlist.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });
    if (existing) {
      return res.status(400).json({ error: 'Already in watchlist' });
    }
    const item = await prisma.watchlist.create({
      data: { userId: req.user!.userId, productId },
    });
    return res.status(201).json({ data: item });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to add to watchlist' });
  }
});

router.delete('/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.watchlist.deleteMany({
      where: { userId: req.user!.userId, productId: req.params.productId },
    });
    return res.json({ data: { message: 'Removed from watchlist' } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove from watchlist' });
  }
});

router.get('/check/:productId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const item = await prisma.watchlist.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId: req.params.productId } },
    });
    return res.json({ data: { isSaved: !!item } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to check watchlist' });
  }
});

export default router;
