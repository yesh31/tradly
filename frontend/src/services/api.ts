import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import type {
  ApiResponse,
  PaginatedResponse,
  LoginInput,
  RegisterInput,
  CreateProductInput,
  ProductFilters,
  User,
  Product,
  Bid,
  Conversation,
  Message,
  Review,
  Notification,
  Watchlist,
  Report,
} from '../types';

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else if (token) {
      resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

const getStoredToken = (): string | null => {
  try {
    const raw = localStorage.getItem('tradly-auth');
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed?.state?.token || null;
    }
  } catch {}
  return null;
};

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await api.post<ApiResponse<{ token: string }>>('/auth/refresh');
        const newToken = data.data?.token;
        if (newToken) {
          const raw = localStorage.getItem('tradly-auth');
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.state.token = newToken;
            localStorage.setItem('tradly-auth', JSON.stringify(parsed));
          }
          processQueue(null, newToken);
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        }
        throw new Error('No token in refresh response');
      } catch (refreshError) {
        processQueue(refreshError, null);
        const raw = localStorage.getItem('tradly-auth');
        if (raw) {
          const parsed = JSON.parse(raw);
          parsed.state.token = null;
          localStorage.setItem('tradly-auth', JSON.stringify(parsed));
        }
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

const extractData = async <T>(promise: Promise<{ data: T }>): Promise<T> => {
  const response = await promise;
  return response.data;
};

export const auth = {
  register: (input: RegisterInput) =>
    extractData(api.post<ApiResponse<{ user: User; token: string }>>('/auth/register', input)),

  login: (input: LoginInput) =>
    extractData(api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', input)),

  logout: () =>
    extractData(api.post<ApiResponse<void>>('/auth/logout')),

  refreshToken: () =>
    extractData(api.post<ApiResponse<{ token: string }>>('/auth/refresh')),

  verifyEmail: (token: string) =>
    extractData(api.post<ApiResponse<void>>('/auth/verify-email', { token })),

  forgotPassword: (email: string) =>
    extractData(api.post<ApiResponse<void>>('/auth/forgot-password', { email })),

  resetPassword: (token: string, password: string) =>
    extractData(api.post<ApiResponse<void>>('/auth/reset-password', { token, password })),

  googleAuth: (credential: string) =>
    extractData(api.post<ApiResponse<{ user: User; token: string }>>('/auth/google', { googleId: credential, email: '', name: '' })),

  getMe: () =>
    extractData(api.get<ApiResponse<User>>('/auth/me')),

  updateProfile: (data: Partial<User>) =>
    extractData(api.put<ApiResponse<User>>('/auth/profile', data)),

  changePassword: (currentPassword: string, newPassword: string) =>
    extractData(api.put<ApiResponse<void>>('/auth/change-password', { oldPassword: currentPassword, newPassword })),
};

export const products = {
  getProducts: (filters?: ProductFilters) =>
    extractData(api.get<PaginatedResponse<Product>>('/products', { params: filters })),

  getProduct: (id: string) =>
    extractData(api.get<ApiResponse<Product>>(`/products/${id}`)),

  createProduct: (data: CreateProductInput) =>
    extractData(api.post<ApiResponse<Product>>('/products', data)),

  updateProduct: (id: string, data: Partial<CreateProductInput>) =>
    extractData(api.put<ApiResponse<Product>>(`/products/${id}`, data)),

  deleteProduct: (id: string) =>
    extractData(api.delete<ApiResponse<void>>(`/products/${id}`)),

  markAsSold: (id: string) =>
    extractData(api.patch<ApiResponse<Product>>(`/products/${id}/sold`)),

  pauseProduct: (id: string) =>
    extractData(api.patch<ApiResponse<Product>>(`/products/${id}/pause`)),

  getUserProducts: (userId: string) =>
    extractData(api.get<PaginatedResponse<Product>>(`/products/user/${userId}`)),

  getTrendingProducts: () =>
    extractData(api.get<ApiResponse<Product[]>>('/products/trending')),

  getRecommendedProducts: () =>
    extractData(api.get<ApiResponse<Product[]>>('/products/recommended')),
};

export const bids = {
  placeBid: (data: { productId: string; amount: number }) =>
    extractData(api.post<ApiResponse<Bid>>('/bids', data)),

  getProductBids: (productId: string) =>
    extractData(api.get<ApiResponse<Bid[]>>(`/products/${productId}/bids`)),

  getMyBids: () =>
    extractData(api.get<ApiResponse<Bid[]>>('/bids/mine')),

  acceptBid: (id: string) =>
    extractData(api.patch<ApiResponse<Bid>>(`/bids/${id}/accept`)),

  rejectBid: (id: string) =>
    extractData(api.patch<ApiResponse<Bid>>(`/bids/${id}/reject`)),
};

export const chat = {
  getConversations: () =>
    extractData(api.get<ApiResponse<Conversation[]>>('/chat/conversations')),

  getConversationMessages: (id: string, page?: number) =>
    extractData(api.get<PaginatedResponse<Message>>(`/chat/conversations/${id}/messages`, { params: { page } })),

  sendMessage: (conversationId: string, data: { content?: string; imageUrl?: string }) =>
    extractData(api.post<ApiResponse<Message>>(`/chat/conversations/${conversationId}/messages`, data)),

  createOrGetConversation: (data: { sellerId: string; productId?: string }) =>
    extractData(api.post<ApiResponse<Conversation>>('/chat/conversations', data)),

  markAsRead: (conversationId: string) =>
    extractData(api.patch<ApiResponse<void>>(`/chat/conversations/${conversationId}/read`)),

  getUnreadCount: () =>
    extractData(api.get<ApiResponse<number>>('/chat/unread')),

  blockUser: (userId: string) =>
    extractData(api.post<ApiResponse<void>>(`/chat/block/${userId}`)),

  reportUser: (data: { reportedId: string; reason: string; description?: string }) =>
    extractData(api.post<ApiResponse<void>>('/chat/report', data)),
};

export const notifications = {
  getNotifications: (page?: number) =>
    extractData(api.get<PaginatedResponse<Notification>>('/notifications', { params: { page } })),

  markAsRead: (id: string) =>
    extractData(api.patch<ApiResponse<void>>(`/notifications/${id}/read`)),

  markAllAsRead: () =>
    extractData(api.patch<ApiResponse<void>>('/notifications/read-all')),

  getUnreadCount: () =>
    extractData(api.get<ApiResponse<number>>('/notifications/unread')),

  deleteNotification: (id: string) =>
    extractData(api.delete<ApiResponse<void>>(`/notifications/${id}`)),
};

export const ai = {
  generateDescription: (data: { title: string; category: string; condition?: string; features?: string[] }) =>
    extractData(api.post<ApiResponse<string>>('/ai/generate-description', data)),

  suggestPrice: (data: { title: string; description: string; category: string; condition: string }) =>
    extractData(api.post<ApiResponse<{ suggestedPrice: number; minPrice: number; maxPrice: number }>>('/ai/suggest-price', data)),

  chatWithAI: (data: { message: string; context?: string }) =>
    extractData(api.post<ApiResponse<{ reply: string }>>('/ai/chat', data)),

  getTrendingSuggestions: () =>
    extractData(api.get<ApiResponse<string[]>>('/ai/trending-suggestions')),
};

export const reviews = {
  getUserReviews: (userId: string, page?: number) =>
    extractData(api.get<PaginatedResponse<Review>>(`/reviews/user/${userId}`, { params: { page } })),

  getProductReviews: (productId: string) =>
    extractData(api.get<ApiResponse<Review[]>>(`/reviews/product/${productId}`)),

  createReview: (data: { productId: string; reviewedId: string; rating: number; comment?: string }) =>
    extractData(api.post<ApiResponse<Review>>('/reviews', data)),

  deleteReview: (id: string) =>
    extractData(api.delete<ApiResponse<void>>(`/reviews/${id}`)),
};

export const watchlist = {
  getWatchlist: () =>
    extractData(api.get<ApiResponse<Watchlist[]>>('/watchlist')),

  addToWatchlist: (productId: string) =>
    extractData(api.post<ApiResponse<Watchlist>>('/watchlist', { productId })),

  removeFromWatchlist: (productId: string) =>
    extractData(api.delete<ApiResponse<void>>(`/watchlist/${productId}`)),

  checkWatchlist: (productId: string) =>
    extractData(api.get<ApiResponse<boolean>>(`/watchlist/check/${productId}`)),
};

export const admin = {
  getUsers: (params?: { page?: number; limit?: number; role?: string; search?: string }) =>
    extractData(api.get<PaginatedResponse<User>>('/admin/users', { params })),

  getUser: (id: string) =>
    extractData(api.get<ApiResponse<User>>(`/admin/users/${id}`)),

  banUser: (id: string, reason: string) =>
    extractData(api.post<ApiResponse<User>>(`/admin/users/${id}/ban`, { reason })),

  unbanUser: (id: string) =>
    extractData(api.post<ApiResponse<User>>(`/admin/users/${id}/unban`)),

  updateUserRole: (id: string, role: 'USER' | 'ADMIN' | 'MODERATOR') =>
    extractData(api.patch<ApiResponse<User>>(`/admin/users/${id}/role`, { role })),

  getAdminProducts: (params?: { page?: number; limit?: number; status?: string; search?: string }) =>
    extractData(api.get<PaginatedResponse<Product>>('/admin/products', { params })),

  updateProductStatus: (id: string, status: string) =>
    extractData(api.patch<ApiResponse<Product>>(`/admin/products/${id}/status`, { status })),

  deleteProductAdmin: (id: string) =>
    extractData(api.delete<ApiResponse<void>>(`/admin/products/${id}`)),

  getReports: (params?: { page?: number; limit?: number; status?: string }) =>
    extractData(api.get<PaginatedResponse<Report>>('/admin/reports', { params })),

  handleReport: (id: string, data: { status: string; actionNote?: string }) =>
    extractData(api.patch<ApiResponse<Report>>(`/admin/reports/${id}`, data)),

  getAnalytics: () =>
    extractData(api.get<ApiResponse<Record<string, unknown>>>('/admin/analytics')),
};

export default api;
