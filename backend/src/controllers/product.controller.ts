import { z } from 'zod';
import { Response } from 'express';
import { prisma } from '../utils/prisma.js';
import { AuthRequest, ProductFilterQuery } from '../types/index.js';
import { calculateDistance, paginate } from '../utils/helpers.js';

const createProductSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().min(1, 'Description is required').max(5000),
  price: z.number().positive('Price must be positive').optional(),
  category: z.string().min(1, 'Category is required'),
  condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']),
  listingType: z.enum(['FIXED_PRICE', 'AUCTION', 'BEST_OFFER']),
  startingBid: z.number().positive('Starting bid must be positive').optional(),
  minBidIncrement: z.number().positive('Min bid increment must be positive').optional(),
  auctionEnd: z.string().optional(),
  location: z.string().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  tags: z.array(z.string()).optional(),
  imageUrls: z.array(z.string()).optional(),
}).refine(
  (data) => {
    if (data.listingType === 'AUCTION') return data.startingBid !== undefined && data.auctionEnd !== undefined;
    return true;
  },
  { message: 'startingBid and auctionEnd are required for AUCTION listings', path: ['listingType'] }
).refine(
  (data) => {
    if (data.listingType !== 'AUCTION') return data.price !== undefined;
    return true;
  },
  { message: 'price is required for FIXED_PRICE and BEST_OFFER listings', path: ['listingType'] }
);

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = createProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const {
      title, description, price, category, condition, listingType,
      startingBid, minBidIncrement, auctionEnd, location, latitude,
      longitude, tags, imageUrls,
    } = parsed.data;

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: listingType !== 'AUCTION' ? price : undefined,
        category,
        condition,
        listingType,
        startingBid: listingType === 'AUCTION' ? startingBid : null,
        minBidIncrement: listingType === 'AUCTION' ? (minBidIncrement ?? 1) : null,
        auctionEnd: listingType === 'AUCTION' ? new Date(auctionEnd!) : null,
        location,
        latitude,
        longitude,
        tags: tags ?? [],
        userId: req.user!.userId,
        images: imageUrls && imageUrls.length > 0
          ? {
              create: imageUrls.map((url, index) => ({
                url,
                order: index,
              })),
            }
          : undefined,
      },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.status(201).json(product);
  } catch (error) {
    console.error('createProduct error:', error);
    return res.status(500).json({ error: 'Failed to create product' });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const query = req.query as unknown as ProductFilterQuery;

    const {
      search, category, minPrice, maxPrice, condition, listingType,
      location, lat, lng, radius, tags, userId, status,
    } = query;

    const page = Math.max(1, parseInt(query.page || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10) || 20));
    const { skip, take } = paginate(page, limit);

    const validSortFields = ['createdAt', 'price', 'viewCount'];
    const sortField = validSortFields.includes(query.sort || '') ? query.sort! : 'createdAt';
    const sortOrder = query.order === 'asc' ? 'asc' as const : 'desc' as const;

    const validStatuses = ['ACTIVE', 'PAUSED', 'SOLD', 'DELETED'] as const;
    const statusFilter = validStatuses.includes((status || 'ACTIVE') as any)
      ? (status as string) || 'ACTIVE'
      : 'ACTIVE';

    const where: Record<string, any> = {};

    where.status = statusFilter;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    if (condition) {
      const validConditions = ['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR'];
      if (validConditions.includes(condition)) {
        where.condition = condition;
      }
    }

    if (listingType) {
      const validTypes = ['FIXED_PRICE', 'AUCTION', 'BEST_OFFER'];
      if (validTypes.includes(listingType)) {
        where.listingType = listingType;
      }
    }

    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }

    if (tags) {
      const tagArray = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
      if (tagArray.length > 0) {
        where.tags = { hasSome: tagArray };
      }
    }

    if (userId) {
      where.userId = userId;
    }

    const latNum = lat ? parseFloat(lat) : NaN;
    const lngNum = lng ? parseFloat(lng) : NaN;
    const radiusNum = radius ? parseFloat(radius) : NaN;

    if (!isNaN(latNum) && !isNaN(lngNum) && !isNaN(radiusNum) && radiusNum > 0) {
      const productsWithCoords = await prisma.product.findMany({
        where: {
          ...where,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: { id: true, latitude: true, longitude: true },
      });

      const geoFilteredIds: string[] = productsWithCoords
        .filter(
          (p: { id: string; latitude: number | null; longitude: number | null }) =>
            p.latitude !== null && p.longitude !== null &&
            calculateDistance(latNum, lngNum, p.latitude, p.longitude) <= radiusNum
        )
        .map((p: { id: string }) => p.id);

      if (geoFilteredIds.length === 0) {
        return res.json({
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }

      where.id = { in: geoFilteredIds };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortOrder },
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          user: {
            select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
};

export const getProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: {
          select: {
            id: true, name: true, avatarUrl: true, bio: true,
            trustScore: true, isVerified: true, createdAt: true,
          },
        },
        bids: {
          orderBy: { amount: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, trustScore: true },
            },
          },
        },
        reviews: { select: { rating: true } },
      },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    await prisma.product.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    const reviews = product.reviews as { rating: number }[] | undefined;
    const reviewStats = {
      average: reviews && reviews.length > 0
        ? Math.round((reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / reviews.length) * 10) / 10
        : 0,
      count: reviews ? reviews.length : 0,
    };

    const { reviews: _reviews, ...productData } = product;

    return res.json({
      ...productData,
      viewCount: productData.viewCount + 1,
      reviewStats,
    });
  } catch (error) {
    console.error('getProduct error:', error);
    return res.status(500).json({ error: 'Failed to fetch product' });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this product' });
    }

    const updateSchema = z.object({
      title: z.string().min(1).max(200).optional(),
      description: z.string().min(1).max(5000).optional(),
      price: z.number().positive().optional(),
      category: z.string().min(1).optional(),
      condition: z.enum(['NEW', 'LIKE_NEW', 'GOOD', 'FAIR', 'POOR']).optional(),
      listingType: z.enum(['FIXED_PRICE', 'AUCTION', 'BEST_OFFER']).optional(),
      startingBid: z.number().positive().optional(),
      minBidIncrement: z.number().positive().optional(),
      auctionEnd: z.string().optional(),
      location: z.string().optional(),
      latitude: z.number().min(-90).max(90).optional(),
      longitude: z.number().min(-180).max(180).optional(),
      tags: z.array(z.string()).optional(),
      imageUrls: z.array(z.string()).optional(),
    });

    const parsed = updateSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: parsed.error.flatten().fieldErrors,
      });
    }

    const { imageUrls, auctionEnd, ...fields } = parsed.data;

    const updateData: Record<string, any> = { ...fields };
    if (auctionEnd) {
      updateData.auctionEnd = new Date(auctionEnd);
    }

    if (imageUrls !== undefined) {
      await prisma.productImage.deleteMany({ where: { productId: id } });

      if (imageUrls.length > 0) {
        await prisma.productImage.createMany({
          data: imageUrls.map((url, index) => ({
            url,
            productId: id,
            order: index,
          })),
        });
      }
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.json(product);
  } catch (error) {
    console.error('updateProduct error:', error);
    return res.status(500).json({ error: 'Failed to update product' });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this product' });
    }

    await prisma.product.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('deleteProduct error:', error);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
};

export const markAsSold = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this product' });
    }

    if (existing.status === 'DELETED') {
      return res.status(400).json({ error: 'Cannot mark a deleted product as sold' });
    }

    const product = await prisma.product.update({
      where: { id },
      data: { status: 'SOLD' },
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.json(product);
  } catch (error) {
    console.error('markAsSold error:', error);
    return res.status(500).json({ error: 'Failed to mark product as sold' });
  }
};

export const pauseProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.userId;

    const existing = await prisma.product.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (existing.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to modify this product' });
    }

    if (existing.status === 'DELETED' || existing.status === 'SOLD') {
      return res.status(400).json({ error: `Cannot pause a product with status ${existing.status}` });
    }

    const newStatus = existing.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';

    const product = await prisma.product.update({
      where: { id },
      data: { status: newStatus },
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.json(product);
  } catch (error) {
    console.error('pauseProduct error:', error);
    return res.status(500).json({ error: 'Failed to toggle product status' });
  }
};

export const getUserProducts = async (req: AuthRequest, res: Response) => {
  try {
    const targetUserId = req.params.userId || (req.query.userId as string);

    if (!targetUserId) {
      return res.status(400).json({ error: 'UserId parameter is required' });
    }

    const page = Math.max(1, parseInt(req.query.page as string || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string || '20', 10) || 20));
    const { skip, take } = paginate(page, limit);

    const validSortFields = ['createdAt', 'price', 'viewCount'];
    const sortField = validSortFields.includes(req.query.sort as string || '') ? req.query.sort as string : 'createdAt';
    const sortOrder = (req.query.order as string) === 'asc' ? 'asc' as const : 'desc' as const;

    const where: Record<string, any> = { userId: targetUserId };

    const statusFilter = req.query.status as string;
    if (statusFilter && ['ACTIVE', 'PAUSED', 'SOLD', 'DELETED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { [sortField]: sortOrder },
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          _count: { select: { bids: true } },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return res.json({
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getUserProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch user products' });
  }
};

export const getTrendingProducts = async (_req: AuthRequest, res: Response) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { gte: thirtyDaysAgo },
      },
      orderBy: [
        { viewCount: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 20,
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.json(products);
  } catch (error) {
    console.error('getTrendingProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch trending products' });
  }
};

export const getRecommendedProducts = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json([]);
    }

    const userId = req.user.userId;

    const [userProducts, userBids, userReviews, userWatchlist] = await Promise.all([
      prisma.product.findMany({
        where: { userId },
        select: { category: true, tags: true },
        take: 50,
      }),
      prisma.bid.findMany({
        where: { userId },
        select: { product: { select: { category: true, tags: true } } },
        take: 50,
      }),
      prisma.review.findMany({
        where: { reviewerId: userId },
        select: { product: { select: { category: true, tags: true } } },
        take: 50,
      }),
      prisma.watchlist.findMany({
        where: { userId },
        select: { product: { select: { category: true, tags: true } } },
        take: 50,
      }),
    ]);

    const categories = new Set<string>();
    const tagSet = new Set<string>();

    const extractFromProduct = (p: { category: string; tags: string[] }) => {
      categories.add(p.category);
      p.tags.forEach((t: string) => tagSet.add(t));
    };

    userProducts.forEach(extractFromProduct);
    userBids.forEach((b: { product: { category: string; tags: string[] } }) => extractFromProduct(b.product));
    userReviews.forEach((r: { product: { category: string; tags: string[] } }) => extractFromProduct(r.product));
    userWatchlist.forEach((w: { product: { category: string; tags: string[] } }) => extractFromProduct(w.product));

    if (categories.size === 0 && tagSet.size === 0) {
      const recentProducts = await prisma.product.findMany({
        where: { status: 'ACTIVE', userId: { not: userId } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          images: { take: 1, orderBy: { order: 'asc' } },
          user: {
            select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
          },
        },
      });
      return res.json(recentProducts);
    }

    const products = await prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        userId: { not: userId },
        OR: [
          { category: { in: Array.from(categories) } },
          { tags: { hasSome: Array.from(tagSet) } },
        ],
      },
      orderBy: { viewCount: 'desc' },
      take: 20,
      include: {
        images: { take: 1, orderBy: { order: 'asc' } },
        user: {
          select: { id: true, name: true, avatarUrl: true, trustScore: true, isVerified: true },
        },
      },
    });

    return res.json(products);
  } catch (error) {
    console.error('getRecommendedProducts error:', error);
    return res.status(500).json({ error: 'Failed to fetch recommended products' });
  }
};
