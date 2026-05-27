import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styled from 'styled-components';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import type { Product } from '@/types';
import { useAuthStore } from '@/store/authStore';

const CardWrapper = styled(motion.div)`
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;
  height: 100%;

  &:hover {
    transform: translate(-4px, -4px) !important;
    box-shadow: 8px 8px 0px ${({ theme }) => theme.colors.border};
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const ImageContainer = styled.div`
  aspect-ratio: 4/3;
  background-color: ${({ theme }) => theme.colors.secondary};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const NoImage = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-size: 0.875rem;
`;

const ConditionBadge = styled.div<{ $variant: string }>`
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  background-color: ${({ theme, $variant }) => {
    switch ($variant) {
      case 'success': return theme.colors.success;
      case 'warning': return '#f59e0b';
      case 'error': return theme.colors.error;
      case 'info': return '#3b82f6';
      default: return theme.colors.foreground;
    }
  }};
  color: ${({ theme, $variant }) => ($variant === 'default' ? theme.colors.background : '#fff')};
  border: 2px solid ${({ theme }) => theme.colors.border};
`;

const Content = styled.div`
  padding: 1rem;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
`;

const Title = styled.h3`
  font-weight: 800;
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.5rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
`;

const Price = styled.span`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
`;

const SubText = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
`;

const UserSection = styled.div`
  margin-top: auto;
  padding-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Avatar = styled.img`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  object-fit: cover;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const FallbackAvatar = styled.div`
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

interface ProductCardProps {
  product: Product;
}

const conditionLabel: Record<string, string> = {
  NEW: 'New',
  LIKE_NEW: 'Like New',
  GOOD: 'Good',
  FAIR: 'Fair',
  POOR: 'Poor',
};

const conditionVariant: Record<string, string> = {
  NEW: 'success',
  LIKE_NEW: 'info',
  GOOD: 'default',
  FAIR: 'warning',
  POOR: 'error',
};

const AuctionCountdown = ({ endDate }: { endDate: string }) => {
  const diff = differenceInSeconds(new Date(endDate), new Date());

  if (diff <= 0) return <SubText style={{ color: 'var(--error)' }}>Ended</SubText>;

  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) return <SubText>{days}d {hours}h left</SubText>;
  if (hours > 0) return <SubText>{hours}h {minutes}m left</SubText>;
  return <SubText style={{ color: 'var(--error)' }}>{minutes}m left</SubText>;
};

const ProductCard = ({ product }: ProductCardProps) => {
  const imageUrl = product.images?.[0]?.url;
  const timeAgo = formatDistanceToNow(new Date(product.createdAt), { addSuffix: true });
  const bidCount = product._count?.bids ?? product.bids?.length ?? 0;
  const { user } = useAuthStore();
  const isOwnListing = user && product.userId === user.id;

  return (
    <Link to={`/products/${product.id}`} style={{ display: 'block', height: '100%' }}>
      <CardWrapper>
        <ImageContainer>
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} />
          ) : (
            <NoImage>No Image</NoImage>
          )}
          <ConditionBadge $variant={conditionVariant[product.condition] ?? 'default'}>
            {conditionLabel[product.condition] ?? product.condition}
          </ConditionBadge>
        </ImageContainer>

        <Content>
          <Title>{product.title}</Title>

          {product.listingType === 'AUCTION' ? (
            <div>
              <Price>₹{product.startingBid}</Price>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <SubText>
                  {bidCount} bid{bidCount !== 1 ? 's' : ''}
                </SubText>
                {product.auctionEnd && <AuctionCountdown endDate={product.auctionEnd} />}
              </div>
            </div>
          ) : (
            <div>
              {product.price != null && (
                <Price>₹{product.price}</Price>
              )}
            </div>
          )}

          {product.location && <SubText style={{ marginTop: '0.25rem' }}>{product.location}</SubText>}

          <UserSection>
            {product.user?.avatarUrl ? (
              <Avatar src={product.user.avatarUrl} alt="" />
            ) : (
              <FallbackAvatar />
            )}
            <SubText style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {isOwnListing ? 'You' : (product.user?.name ?? 'Unknown')}
            </SubText>
            <SubText style={{ textAlign: 'right' }}>{timeAgo}</SubText>
          </UserSection>
        </Content>
      </CardWrapper>
    </Link>
  );
};

export default ProductCard;
