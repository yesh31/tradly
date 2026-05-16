import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest } from '../types/index.js';
import { paginate } from '../utils/helpers.js';

export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    const search = req.query.search as string;

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, name: true, email: true, username: true, avatarUrl: true,
          role: true, isVerified: true, isBanned: true, trustScore: true,
          isTrustedSeller: true, createdAt: true, _count: { select: { products: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.json({ data: users, total, page, totalPages: Math.ceil(total / take) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
};

export const getUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true, name: true, email: true, username: true, avatarUrl: true,
        bio: true, phone: true, location: true, role: true, isVerified: true,
        isBanned: true, banReason: true, trustScore: true, isTrustedSeller: true,
        emailVerified: true, createdAt: true,
        _count: { select: { products: true, reviewsReceived: true, reports: true } },
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ data: user });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch user' });
  }
};

export const banUser = async (req: AuthRequest, res: Response) => {
  try {
    const { reason } = req.body;
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: true, banReason: reason || 'Violation of terms' },
    });
    return res.json({ data: { id: user.id, isBanned: true, banReason: user.banReason } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to ban user' });
  }
};

export const unbanUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isBanned: false, banReason: null },
    });
    return res.json({ data: { id: user.id, isBanned: false } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unban user' });
  }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!['USER', 'ADMIN', 'MODERATOR'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
    });
    return res.json({ data: { id: user.id, role: user.role } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update role' });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    const status = req.query.status as string;
    const search = req.query.search as string;

    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          user: { select: { id: true, name: true, username: true, avatarUrl: true } },
          _count: { select: { bids: true, reports: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({ data: products, total, page, totalPages: Math.ceil(total / take) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const updateProductStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { status } = req.body;
    if (!['ACTIVE', 'PAUSED', 'SOLD', 'DELETED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { status },
    });
    return res.json({ data: product });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.update({
      where: { id: req.params.id },
      data: { status: 'DELETED' },
    });
    return res.json({ data: { message: 'Product deleted' } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const getReports = async (req: AuthRequest, res: Response) => {
  try {
    const { skip, take, page } = paginate(
      parseInt(req.query.page as string) || 1,
      parseInt(req.query.limit as string) || 20
    );
    const status = req.query.status as string;

    const where: any = {};
    if (status) where.status = status;

    const [reports, total] = await Promise.all([
      prisma.report.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, name: true, username: true, avatarUrl: true } },
          reported: { select: { id: true, name: true, username: true, avatarUrl: true } },
          product: { select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' } } } },
        },
      }),
      prisma.report.count({ where }),
    ]);

    return res.json({ data: reports, total, page, totalPages: Math.ceil(total / take) });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reports' });
  }
};

export const handleReport = async (req: AuthRequest, res: Response) => {
  try {
    const { status, adminNote } = req.body;
    if (!['PENDING', 'REVIEWED', 'RESOLVED', 'DISMISSED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const report = await prisma.report.update({
      where: { id: req.params.id },
      data: {
        status,
        adminNote: adminNote || undefined,
        resolvedAt: status === 'RESOLVED' ? new Date() : undefined,
      },
    });
    return res.json({ data: report });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update report' });
  }
};

export const getAnalytics = async (req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers, newUsers30d, totalProducts, activeProducts,
      productsSold30d, totalBids, totalReports, pendingReports,
      revenueAgg, avgPriceAgg, totalAdmins, totalModerators, prevMonthUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
      prisma.product.count(),
      prisma.product.count({ where: { status: 'ACTIVE' } }),
      prisma.product.count({ where: { status: 'SOLD', updatedAt: { gte: thirtyDaysAgo } } }),
      prisma.bid.count(),
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.product.aggregate({ where: { status: 'SOLD', updatedAt: { gte: thirtyDaysAgo } }, _sum: { price: true } }),
      prisma.product.aggregate({ where: { status: 'ACTIVE' }, _avg: { price: true } }),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'MODERATOR' } }),
      prisma.user.count({ where: { createdAt: { lt: thirtyDaysAgo } } }),
    ]);

    return res.json({
      data: {
        totalUsers,
        newUsers30d,
        totalProducts,
        activeProducts,
        productsSold30d,
        totalBids,
        totalReports,
        pendingReports,
        conversionRate: totalProducts > 0 ? +((productsSold30d / totalProducts) * 100).toFixed(1) : 0,
        userGrowth: prevMonthUsers > 0 ? +((newUsers30d / prevMonthUsers) * 100).toFixed(1) : 0,
        revenue30d: revenueAgg._sum.price ?? 0,
        avgListingPrice: avgPriceAgg._avg.price ?? 0,
        totalAdmins,
        totalModerators,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch analytics' });
  }
};
