import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import toast from 'react-hot-toast';
import { products, bids, watchlist, chat, reviews } from '@/services/api';
import { getSocket, joinProduct, leaveProduct } from '@/services/socket';
import { useAuthStore } from '@/store/authStore';
import type { Review } from '@/types';
import { Button, Badge, Skeleton, Modal, Input } from '@/components/ui';

// --- STYLED COMPONENTS ---

const PageContainer = styled(motion.div)`
  max-width: ${({ theme }) => theme.breakpoints.xl};
  margin: 0 auto;
  padding: 2rem 1rem;
  min-height: calc(100vh - 4rem);
  background-color: ${({ theme }) => theme.colors.background};
`;

const LayoutGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 2rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
`;

const GallerySection = styled.div`
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-column: span 3;
  }
`;

const MainImageContainer = styled.div`
  aspect-ratio: 4/3;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: 0;
  overflow: hidden;
  position: relative;
  
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NoImageFallback = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ThumbnailsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

const ThumbnailBtn = styled.button<{ $active: boolean }>`
  flex-shrink: 0;
  width: 5rem;
  height: 4rem;
  border: 2px solid ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.border)};
  background-color: transparent;
  padding: 0;
  cursor: pointer;
  transition: all 0.2s ease;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  &:hover {
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const InfoSection = styled.div`
  @media (min-width: ${({ theme }) => theme.breakpoints.lg}) {
    grid-column: span 2;
  }
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  line-height: 1.1;
  margin: 0.5rem 0;
`;

const PriceText = styled.p`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const SectionContainer = styled.section`
  margin-top: 3rem;
  max-width: 56rem; /* max-w-4xl */
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding-bottom: 0.5rem;
`;

const DescriptionText = styled.p`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.foreground};
  line-height: 1.6;
  white-space: pre-wrap;
`;

const TagsContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
`;

const Tag = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.foreground};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const SellerCard = styled(Link)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  text-decoration: none;
  color: inherit;
  transition: all 0.2s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const SellerAvatar = styled.img`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.foreground};
  object-fit: cover;
`;

const SellerFallback = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: 2px solid ${({ theme }) => theme.colors.foreground};
  background-color: ${({ theme }) => theme.colors.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
`;

const TrustScoreBar = styled.div`
  height: 0.5rem;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  width: 100%;
  margin-top: 0.5rem;
`;

const TrustScoreFill = styled.div<{ $score: number }>`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.foreground};
  width: ${({ $score }) => $score}%;
  transition: width 0.5s ease;
`;

const AuctionBox = styled.div`
  padding: 1rem;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 2px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
`;

const StatLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0;
`;

const StatValue = styled.p`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
`;

const Th = styled.th`
  text-align: left;
  padding: 0.75rem 0;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const Td = styled.td`
  padding: 0.75rem 0;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.foreground};
  font-weight: 600;
`;

const ReviewWrapper = styled.div`
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 1rem;
  margin-bottom: 1rem;
`;

// --- ICONS ---
const HeartIcon = ({ filled }: { filled?: boolean }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
  </svg>
);

const FlagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
  </svg>
);

// --- UTILS & COMPONENTS ---

const conditionLabel: Record<string, string> = { NEW: 'New', LIKE_NEW: 'Like New', GOOD: 'Good', FAIR: 'Fair', POOR: 'Poor' };
const conditionVariant: Record<string, any> = { NEW: 'success', LIKE_NEW: 'info', GOOD: 'default', FAIR: 'warning', POOR: 'error' };
const listingTypeLabel: Record<string, string> = { FIXED_PRICE: 'Fixed Price', AUCTION: 'Auction', BEST_OFFER: 'Best Offer' };

const pageTransition = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.125rem' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} style={{ width: '1rem', height: '1rem', color: i < rating ? 'var(--foreground)' : 'var(--border)' }} fill="currentColor" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function AuctionCountdown({ endDate }: { endDate: string }) {
  const [seconds, setSeconds] = useState(() => differenceInSeconds(new Date(endDate), new Date()));

  useEffect(() => {
    setSeconds(differenceInSeconds(new Date(endDate), new Date()));
    const interval = setInterval(() => {
      setSeconds(differenceInSeconds(new Date(endDate), new Date()));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (seconds <= 0) return <span style={{ fontSize: '0.875rem', color: 'var(--error)', fontWeight: 700, textTransform: 'uppercase' }}>Auction ended</span>;

  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {days > 0 && <div style={{ textAlign: 'center' }}><StatValue>{days}</StatValue><StatLabel>days</StatLabel></div>}
      <div style={{ textAlign: 'center' }}><StatValue>{String(hours).padStart(2, '0')}</StatValue><StatLabel>hours</StatLabel></div>
      <div style={{ textAlign: 'center' }}><StatValue>{String(minutes).padStart(2, '0')}</StatValue><StatLabel>mins</StatLabel></div>
      <div style={{ textAlign: 'center' }}><StatValue>{String(secs).padStart(2, '0')}</StatValue><StatLabel>secs</StatLabel></div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <ReviewWrapper>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {review.reviewer?.avatarUrl ? (
          <img src={review.reviewer.avatarUrl} alt="" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
        ) : (
          <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, border: '1px solid var(--border)' }}>
            {review.reviewer?.name?.charAt(0) ?? '?'}
          </div>
        )}
        <div>
          <p style={{ fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>{review.reviewer?.name ?? 'Anonymous'}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
            <StarRating rating={review.rating} />
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)' }}>{formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
      {review.comment && <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--foreground)' }}>{review.comment}</p>}
    </ReviewWrapper>
  );
}

function LoadingSkeleton() {
  return (
    <PageContainer>
      <LayoutGrid>
        <GallerySection>
          <Skeleton variant="rectangular" height={480} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="rectangular" width={80} height={64} />)}
          </div>
        </GallerySection>
        <InfoSection>
          <Skeleton variant="text" height={32} width="80%" />
          <Skeleton variant="text" height={28} width="40%" />
          <Skeleton variant="text" height={20} width="60%" />
          <div style={{ paddingTop: '1rem' }}>
            <Skeleton variant="text" count={3} />
          </div>
        </InfoSection>
      </LayoutGrid>
    </PageContainer>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [bidAmount, setBidAmount] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDescription, setReportDescription] = useState('');

  const { data: productRes, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => products.getProduct(id!),
    enabled: !!id,
  });

  const product = productRes?.data;

  const { data: bidsRes } = useQuery({
    queryKey: ['bids', id],
    queryFn: () => bids.getProductBids(id!),
    enabled: !!id && product?.listingType === 'AUCTION',
  });

  const productBids = bidsRes?.data;

  const { data: watchlistRes } = useQuery({
    queryKey: ['watchlist', 'check', id],
    queryFn: () => watchlist.checkWatchlist(id!),
    enabled: !!id && !!user,
  });

  const isWatched = watchlistRes?.data ?? false;

  const { data: reviewsRes } = useQuery({
    queryKey: ['reviews', id],
    queryFn: () => reviews.getProductReviews(id!),
    enabled: !!id,
  });

  const productReviews = reviewsRes?.data;

  const highestBid = productBids && productBids.length > 0
    ? Math.max(...productBids.map((b) => b.amount))
    : (product?.startingBid ?? 0);

  const images = product?.images ?? [];
  const currentImage = images[selectedImageIndex]?.url;

  useEffect(() => {
    const sock = getSocket();
    if (!sock?.connected || !id) return;

    joinProduct(id);

    const handleNewBid = () => {
      queryClient.invalidateQueries({ queryKey: ['bids', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    };

    sock.on('bid:received', handleNewBid);

    return () => {
      leaveProduct(id);
      sock.off('bid:received', handleNewBid);
    };
  }, [id, queryClient]);

  const placeBidMutation = useMutation({
    mutationFn: (amount: number) => bids.placeBid({ productId: id!, amount }),
    onSuccess: () => {
      toast.success('Bid placed successfully!');
      setBidAmount('');
      queryClient.invalidateQueries({ queryKey: ['bids', id] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to place bid'),
  });

  const addWatchlistMutation = useMutation({
    mutationFn: () => watchlist.addToWatchlist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', id] });
      toast.success('Added to watchlist');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed'),
  });

  const removeWatchlistMutation = useMutation({
    mutationFn: () => watchlist.removeFromWatchlist(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist', 'check', id] });
      toast.success('Removed from watchlist');
    },
    onError: (err: Error) => toast.error(err.message || 'Failed'),
  });

  const createConversationMutation = useMutation({
    mutationFn: () => chat.createOrGetConversation({ sellerId: product!.userId, productId: id! }),
    onSuccess: (res) => {
      if (res.data?.id) {
        navigate(`/chat?conversation=${res.data.id}`);
      } else {
        navigate('/chat');
      }
    },
    onError: (err: Error) => toast.error(err.message || 'Failed to start conversation'),
  });

  const handlePlaceBid = useCallback(() => {
    const amount = parseFloat(bidAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid bid amount');
      return;
    }
    if (amount <= highestBid) {
      toast.error(`Bid must be higher than current bid of $${highestBid.toFixed(2)}`);
      return;
    }
    placeBidMutation.mutate(amount);
  }, [bidAmount, highestBid, placeBidMutation]);

  const handleWatchlistToggle = useCallback(() => {
    if (!user) {
      toast.error('Please sign in to save items');
      return;
    }
    if (isWatched) removeWatchlistMutation.mutate();
    else addWatchlistMutation.mutate();
  }, [user, isWatched, addWatchlistMutation, removeWatchlistMutation]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: product?.title, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    }
  }, [product?.title]);

  const handleReport = useCallback(async () => {
    if (!reportReason) {
      toast.error('Please select a reason');
      return;
    }
    try {
      const { default: api } = await import('@/services/api');
      await api.post('/reports', { productId: id, reason: reportReason, description: reportDescription });
      toast.success('Report submitted');
      setShowReportModal(false);
      setReportReason('');
      setReportDescription('');
    } catch {
      toast.error('Failed to submit report');
    }
  }, [id, reportReason, reportDescription]);

  const handleContactSeller = useCallback(() => {
    if (!user) {
      toast.error('Please sign in to contact the seller');
      return;
    }
    createConversationMutation.mutate();
  }, [user, createConversationMutation]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !product) {
    return (
      <PageContainer style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, textTransform: 'uppercase' }}>Product not found</h2>
          <p style={{ color: 'var(--muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>This product may have been removed or does not exist.</p>
          <Link to="/explore">
            <Button variant="outline">Browse Products</Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer {...pageTransition}>
      <LayoutGrid>
        <GallerySection>
          <MainImageContainer>
            {currentImage ? (
              <img src={currentImage} alt={product.title} />
            ) : (
              <NoImageFallback>No Image Available</NoImageFallback>
            )}
          </MainImageContainer>
          {images.length > 1 && (
            <ThumbnailsContainer>
              {images.map((img, i) => (
                <ThumbnailBtn key={img.id} $active={i === selectedImageIndex} onClick={() => setSelectedImageIndex(i)}>
                  <img src={img.thumbnail ?? img.url} alt={img.alt ?? ''} />
                </ThumbnailBtn>
              ))}
            </ThumbnailsContainer>
          )}
        </GallerySection>

        <InfoSection>
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Badge size="sm">{product.category}</Badge>
              <Badge size="sm" variant={conditionVariant[product.condition] ?? 'default'}>
                {conditionLabel[product.condition] ?? product.condition}
              </Badge>
              <Badge size="sm" variant="info">{listingTypeLabel[product.listingType] ?? product.listingType}</Badge>
            </div>
            <Title>{product.title}</Title>

            {product.listingType === 'AUCTION' ? (
              <div style={{ marginTop: '1rem' }}>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', fontSize: '0.875rem' }}>Starting bid: <span style={{ color: 'var(--foreground)' }}>${product.startingBid?.toFixed(2)}</span></p>
                {product.auctionEnd && (
                  <div style={{ marginTop: '1rem' }}>
                    <AuctionCountdown endDate={product.auctionEnd} />
                  </div>
                )}
                <AuctionBox>
                  <div>
                    <StatLabel>Current highest bid</StatLabel>
                    <StatValue>${highestBid.toFixed(2)}</StatValue>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <StatLabel>Total bids</StatLabel>
                    <StatValue>{productBids?.length ?? 0}</StatValue>
                  </div>
                </AuctionBox>
                {user && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                    <Input
                      type="number"
                      placeholder={`Min $${(highestBid + (product.minBidIncrement ?? 1)).toFixed(2)}`}
                      value={bidAmount}
                      onChange={(e) => setBidAmount(e.target.value)}
                      step="0.01"
                      min={(highestBid + (product.minBidIncrement ?? 1)).toFixed(2)}
                    />
                    <Button variant="primary" onClick={handlePlaceBid} isLoading={placeBidMutation.isPending} disabled={!bidAmount}>
                      Place Bid
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ marginTop: '1rem' }}>
                {product.price != null && <PriceText>${product.price.toFixed(2)}</PriceText>}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <Button variant="primary" size="lg" fullWidth>Buy Now</Button>
                  <Button variant="outline" size="lg" fullWidth onClick={handleContactSeller} isLoading={createConversationMutation.isPending}>
                    <ChatIcon /> Contact Seller
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '2px solid var(--border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
            <SellerCard to={`/profile/${product.user?.id}`}>
              {product.user?.avatarUrl ? (
                <SellerAvatar src={product.user.avatarUrl} alt="" />
              ) : (
                <SellerFallback>{product.user?.name?.charAt(0) ?? '?'}</SellerFallback>
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>{product.user?.name ?? 'Unknown Seller'}</p>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', margin: 0, textTransform: 'uppercase' }}>
                  Member since {product.user?.createdAt ? format(new Date(product.user.createdAt), 'MMM yyyy') : 'N/A'}
                </p>
              </div>
            </SellerCard>

            {product.user?.trustScore != null && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
                  <span>Trust Score</span>
                  <span>{product.user.trustScore}/100</span>
                </div>
                <TrustScoreBar>
                  <TrustScoreFill $score={product.user.trustScore} />
                </TrustScoreBar>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
            <Button variant="ghost" size="sm" onClick={handleWatchlistToggle}>
              <HeartIcon filled={isWatched} /> {isWatched ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleShare}>
              <ShareIcon /> Share
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowReportModal(true)}>
              <FlagIcon /> Report
            </Button>
          </div>
        </InfoSection>
      </LayoutGrid>

      <div style={{ marginTop: '4rem' }}>
        <SectionContainer>
          <SectionTitle>Description</SectionTitle>
          <DescriptionText>{product.description}</DescriptionText>
        </SectionContainer>

        {product.tags.length > 0 && (
          <SectionContainer>
            <SectionTitle>Tags</SectionTitle>
            <TagsContainer>
              {product.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
            </TagsContainer>
          </SectionContainer>
        )}

        {product.location && (
          <SectionContainer>
            <SectionTitle>Location</SectionTitle>
            <p style={{ fontWeight: 600, textTransform: 'uppercase' }}>{product.location}</p>
          </SectionContainer>
        )}

        {product.listingType === 'AUCTION' && productBids && (
          <SectionContainer>
            <SectionTitle>Bid History ({productBids.length})</SectionTitle>
            {productBids.length === 0 ? (
              <p style={{ fontWeight: 600, color: 'var(--muted)' }}>No bids yet. Be the first to bid!</p>
            ) : (
              <div style={{ overflowX: 'auto', border: '2px solid var(--border)' }}>
                <Table>
                  <thead>
                    <tr>
                      <Th style={{ paddingLeft: '1rem' }}>Bidder</Th>
                      <Th style={{ textAlign: 'right' }}>Amount</Th>
                      <Th style={{ textAlign: 'right', paddingRight: '1rem' }}>Time</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...productBids].reverse().map((bid) => (
                      <tr key={bid.id}>
                        <Td style={{ paddingLeft: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {bid.user?.avatarUrl ? (
                            <img src={bid.user.avatarUrl} alt="" style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 700 }}>
                              {bid.user?.name?.charAt(0) ?? '?'}
                            </div>
                          )}
                          {bid.user?.name ?? 'Anonymous'}
                        </Td>
                        <Td style={{ textAlign: 'right' }}>${bid.amount.toFixed(2)}</Td>
                        <Td style={{ textAlign: 'right', paddingRight: '1rem', color: 'var(--muted)', fontSize: '0.75rem' }}>
                          {formatDistanceToNow(new Date(bid.createdAt), { addSuffix: true })}
                        </Td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </SectionContainer>
        )}

        <SectionContainer>
          <SectionTitle>Reviews ({productReviews?.length ?? 0})</SectionTitle>
          {productReviews && productReviews.length > 0 ? (
            <div>
              {productReviews.map(review => <ReviewCard key={review.id} review={review} />)}
            </div>
          ) : (
            <p style={{ fontWeight: 600, color: 'var(--muted)' }}>No reviews yet.</p>
          )}
        </SectionContainer>
      </div>

      <Modal isOpen={showReportModal} onClose={() => setShowReportModal(false)} title="Report Listing" size="sm">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>Reason</label>
            <select
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              style={{ width: '100%', padding: '0.5rem', fontFamily: 'inherit', fontWeight: 600, border: '2px solid var(--border)', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
            >
              <option value="">Select a reason</option>
              <option value="SPAM">Spam</option>
              <option value="INAPPROPRIATE">Inappropriate content</option>
              <option value="FAKE">Fake or misleading</option>
              <option value="PROHIBITED">Prohibited item</option>
              <option value="DUPLICATE">Duplicate listing</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          <Input textarea label="Additional details" placeholder="Provide more context..." value={reportDescription} onChange={(e) => setReportDescription(e.target.value)} rows={3} />
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <Button variant="outline" fullWidth onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button variant="danger" fullWidth onClick={handleReport}>Submit Report</Button>
          </div>
        </div>
      </Modal>
    </PageContainer>
  );
}
