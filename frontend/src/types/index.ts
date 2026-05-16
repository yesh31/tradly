export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  phone?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  role: 'USER' | 'ADMIN' | 'MODERATOR';
  isVerified: boolean;
  isGoogleAccount: boolean;
  trustScore: number;
  isTrustedSeller: boolean;
  isBanned: boolean;
  banReason?: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  thumbnail?: string;
  alt?: string;
  order: number;
  productId: string;
}

export interface Bid {
  id: string;
  amount: number;
  isWinner: boolean;
  createdAt: string;
  userId: string;
  user?: User;
  productId: string;
  product?: Product;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price?: number;
  category: string;
  condition: 'NEW' | 'LIKE_NEW' | 'GOOD' | 'FAIR' | 'POOR';
  listingType: 'FIXED_PRICE' | 'AUCTION' | 'BEST_OFFER';
  startingBid?: number;
  minBidIncrement?: number;
  auctionEnd?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  tags: string[];
  status: 'ACTIVE' | 'PAUSED' | 'SOLD' | 'DELETED';
  viewCount: number;
  isPromoted: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  user?: User;
  images?: ProductImage[];
  bids?: Bid[];
  _count?: {
    bids?: number;
    reviews?: number;
    watchlist?: number;
  };
}

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  buyerId: string;
  sellerId: string;
  productId?: string;
  buyer?: User;
  seller?: User;
  product?: Product;
  messages?: Message[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface Message {
  id: string;
  content?: string;
  imageUrl?: string;
  type: 'TEXT' | 'IMAGE' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  senderId: string;
  sender?: User;
  conversationId: string;
}

export interface Review {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewerId: string;
  reviewer?: User;
  reviewedId: string;
  reviewed?: User;
  productId: string;
  product?: Product;
}

export interface Notification {
  id: string;
  type: 'BID_RECEIVED' | 'BID_OUTBID' | 'AUCTION_WON' | 'AUCTION_ENDING' | 'NEW_MESSAGE' | 'PRODUCT_SOLD' | 'PRODUCT_LIKED' | 'FOLLOW' | 'SYSTEM';
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface Watchlist {
  id: string;
  createdAt: string;
  userId: string;
  productId: string;
  product?: Product;
}

export interface Report {
  id: string;
  reason: string;
  description?: string;
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporterId: string;
  reportedId: string;
  productId?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  username: string;
}

export interface CreateProductInput {
  title: string;
  description: string;
  price?: number;
  category: string;
  condition: string;
  listingType?: string;
  startingBid?: number;
  minBidIncrement?: number;
  auctionEnd?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  tags?: string[];
  imageUrls?: string[];
}

export interface ProductFilters {
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  condition?: string;
  listingType?: string;
  location?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  tags?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}
