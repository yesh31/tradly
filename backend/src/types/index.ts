import { Request } from 'express';

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ProductFilterQuery extends PaginationQuery {
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  condition?: string;
  listingType?: string;
  location?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  search?: string;
  tags?: string;
  userId?: string;
  status?: string;
}

export interface ChatMessagePayload {
  content?: string;
  imageUrl?: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  conversationId: string;
}

export interface BidPayload {
  amount: number;
  productId: string;
}

export interface AIGenerateDescriptionPayload {
  imageUrls: string[];
  category: string;
  condition: string;
}

export interface AIPriceSuggestionPayload {
  title: string;
  description: string;
  category: string;
  condition: string;
}

export interface AIChatPayload {
  message: string;
  conversationId?: string;
  context?: {
    productId?: string;
    category?: string;
    price?: number;
  };
}
