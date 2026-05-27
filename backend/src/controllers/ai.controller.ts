import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AuthRequest, AIPriceSuggestionPayload, AIChatPayload } from '../types/index.js';
import { generateProductDescription, suggestFairPrice, chatResponse } from '../services/ai.service.js';
import { prisma } from '../utils/prisma.js';

const conversationStore = new Map<string, { role: string; content: string }[]>();

export async function generateDescription(req: AuthRequest, res: Response) {
  try {
    const { imageUrls, category, condition, title, features } = req.body;

    if ((!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) && !title) {
      return res.status(400).json({ error: 'Either image URLs or a title is required' });
    }

    if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 images allowed' });
    }

    const result = await generateProductDescription({ imageUrls, category, condition, title, features });

    return res.json({ data: result.description });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate description' });
  }
}

export async function suggestPrice(req: AuthRequest, res: Response) {
  try {
    const { title, description, category, condition } = req.body as AIPriceSuggestionPayload;

    if (!title) {
      return res.status(400).json({ error: 'Product title is required' });
    }

    const result = await suggestFairPrice(title, description || '', category || '', condition || '');

    return res.json({ data: result });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to suggest price' });
  }
}

export async function chatWithAI(req: AuthRequest, res: Response) {
  try {
    const { message, conversationId, context } = req.body as AIChatPayload;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    let history: { role: string; content: string }[];
    let currentId = conversationId;

    if (currentId && conversationStore.has(currentId)) {
      history = conversationStore.get(currentId)!;
    } else {
      history = [];
      currentId = currentId || uuidv4();
    }

    history.push({ role: 'user', content: message });

    const reply = await chatResponse(history, context || {});

    history.push({ role: 'assistant', content: reply });

    conversationStore.set(currentId, history);

    if (conversationStore.size > 10000) {
      const keys = conversationStore.keys();
      for (let i = 0; i < 1000; i++) {
        conversationStore.delete(keys.next().value!);
      }
    }

    return res.json({ data: { reply, conversationId: currentId } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to process chat message' });
  }
}

export async function getTrendingSuggestions(_req: AuthRequest, res: Response) {
  try {
    const recentProducts = await prisma.product.findMany({
      where: { status: 'ACTIVE' },
      select: { category: true, tags: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const categoryCounts: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};

    for (const product of recentProducts) {
      categoryCounts[product.category] = (categoryCounts[product.category] || 0) + 1;
      for (const tag of product.tags) {
        tagCounts[tag.toLowerCase()] = (tagCounts[tag.toLowerCase()] || 0) + 1;
      }
    }

    const topCategories = Object.entries(categoryCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name]) => name);

    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name]) => name);

    const suggestions = [...new Set([...topCategories, ...topTags])].slice(0, 12);

    return res.json({ data: { suggestions } });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to get trending suggestions' });
  }
}
