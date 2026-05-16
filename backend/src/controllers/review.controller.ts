import { Response } from 'express';
import { AuthRequest } from '../types/index.js';
import { prisma } from '../utils/prisma.js';

export async function createReview(req: AuthRequest, res: Response) {
  try {
    const { rating, comment, productId, reviewedUserId } = req.body;
    const userId = req.user!.userId;

    if (!rating || !productId || !reviewedUserId) {
      return res.status(400).json({ error: 'Rating, productId, and reviewedUserId are required' });
    }

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5' });
    }

    if (userId === reviewedUserId) {
      return res.status(400).json({ error: 'You cannot review yourself' });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true, userId: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.status !== 'SOLD') {
      return res.status(400).json({ error: 'You can only review a product after it has been sold' });
    }

    if (product.userId !== userId && product.userId !== reviewedUserId) {
      const conversation = await prisma.conversation.findFirst({
        where: {
          productId,
          OR: [
            { buyerId: userId, sellerId: reviewedUserId },
            { buyerId: reviewedUserId, sellerId: userId },
          ],
        },
      });

      if (!conversation) {
        return res.status(400).json({ error: 'You must have a transaction with this user to leave a review' });
      }
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        reviewerId_reviewedId_productId: {
          reviewerId: userId,
          reviewedId: reviewedUserId,
          productId,
        },
      },
    });

    if (existingReview) {
      return res.status(409).json({ error: 'You have already reviewed this user for this product' });
    }

    const review = await prisma.review.create({
      data: {
        rating: ratingNum,
        comment: comment?.trim() || null,
        reviewerId: userId,
        reviewedId: reviewedUserId,
        productId,
      },
      include: {
        reviewer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
    });

    const allReviews = await prisma.review.findMany({
      where: { reviewedId: reviewedUserId },
      select: { rating: true },
    });

    const avgRating =
      allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
    const trustScore = Math.round((avgRating / 5) * 100);

    await prisma.user.update({
      where: { id: reviewedUserId },
      data: { trustScore: Math.min(100, Math.max(0, trustScore)) },
    });

    return res.status(201).json(review);
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'You have already reviewed this user for this product' });
    }
    return res.status(500).json({ error: 'Failed to create review' });
  }
}

export async function getUserReviews(req: AuthRequest, res: Response) {
  try {
    const userId = req.params.userId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { reviewedId: userId },
        include: {
          reviewer: {
            select: { id: true, name: true, username: true, avatarUrl: true },
          },
          product: {
            select: { id: true, title: true, images: { take: 1, orderBy: { order: 'asc' }, select: { url: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { reviewedId: userId } }),
    ]);

    return res.json({
      reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}

export async function getProductReviews(req: AuthRequest, res: Response) {
  try {
    const productId = req.params.productId;

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        reviewer: {
          select: { id: true, name: true, username: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ reviews });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch product reviews' });
  }
}

export async function deleteReview(req: AuthRequest, res: Response) {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user!.userId;

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reviewerId: true, reviewedId: true },
    });

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.reviewerId !== userId) {
      return res.status(403).json({ error: 'You can only delete your own reviews' });
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    const allReviews = await prisma.review.findMany({
      where: { reviewedId: review.reviewedId },
      select: { rating: true },
    });

    let trustScore = 0;
      if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / allReviews.length;
      trustScore = Math.round((avgRating / 5) * 100);
    }

    await prisma.user.update({
      where: { id: review.reviewedId },
      data: { trustScore: Math.min(100, Math.max(0, trustScore)) },
    });

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete review' });
  }
}
