import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { formatDistanceToNow, format } from 'date-fns';
import {
  IoPerson,
  IoLocationSharp,
  IoCalendar,
  IoStar,
  IoShieldCheckmark,
  IoGrid,
  IoChatbubbles,
  IoPencil,
  IoCamera,
} from 'react-icons/io5';
import type { User, Product, Review, PaginatedResponse } from '@/types';
import { products as productsApi, reviews as reviewsApi, auth } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { Button, Skeleton, Modal, Input, EmptyState, ProductCard } from '@/components/ui';

type Tab = 'listings' | 'reviews';

const tabs: { key: Tab; label: string; icon: typeof IoGrid }[] = [
  { key: 'listings', label: 'Listings', icon: IoGrid },
  { key: 'reviews', label: 'Reviews', icon: IoChatbubbles },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  max-width: 56rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const CoverPhoto = styled(motion.div)`
  position: relative;
  height: 12rem;
  background-color: ${({ theme }) => theme.colors.foreground};
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-bottom: none;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    height: 14rem;
  }
`;

const CoverPhotoButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const ProfileHeader = styled(motion.div)`
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  margin-top: -3rem;
  padding: 0 1rem 1.5rem;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    flex-direction: row;
    align-items: flex-end;
    padding: 0 1.5rem 1.5rem;
  }
`;

const AvatarContainer = styled.div`
  position: relative;
`;

const AvatarImg = styled.img`
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.background};
  object-fit: cover;
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const AvatarFallback = styled.div`
  width: 6rem;
  height: 6rem;
  border-radius: 50%;
  border: 4px solid ${({ theme }) => theme.colors.background};
  background-color: ${({ theme }) => theme.colors.secondary};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.muted};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
`;

const VerifiedBadge = styled.div`
  position: absolute;
  bottom: -0.25rem;
  right: -0.25rem;
  background-color: ${({ theme }) => theme.colors.background};
  border-radius: 50%;
  padding: 0.125rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
`;

const UserInfo = styled.div`
  flex: 1;
  min-width: 0;
  padding-top: 0.5rem;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding-top: 0;
  }
`;

const NameRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Name = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    font-size: 1.5rem;
  }
`;

const Username = styled.p`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
`;

const Bio = styled.p`
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
`;

const MetaDataRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const TrustScoreSection = styled(motion.div)`
  padding: 0 1rem 1.5rem;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 1.5rem 1.5rem;
  }
`;

const TrustScoreHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.375rem;
`;

const TrustScoreLabel = styled.span`
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
`;

const TrustScoreValue = styled.span`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
`;

const TrustScoreBar = styled.div`
  width: 100%;
  height: 0.5rem;
  background-color: ${({ theme }) => theme.colors.secondary};
  border: 1px solid ${({ theme }) => theme.colors.border};
  overflow: hidden;
`;

const TrustScoreFill = styled(motion.div)`
  height: 100%;
  background-color: ${({ theme }) => theme.colors.foreground};
`;

const StatsGrid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  padding: 0 1rem 2rem;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 1.5rem 2rem;
  }
`;

const StatBox = styled.div`
  text-align: center;
  padding: 0.75rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
`;

const StatValue = styled.p`
  font-size: 1.125rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
`;

const StatLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
`;

const TabsContainer = styled(motion.div)`
  border: 2px solid ${({ theme }) => theme.colors.border};
  margin-bottom: 1.5rem;
  display: flex;
  background-color: ${({ theme }) => theme.colors.background};
`;

const TabButton = styled.button<{ $active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  background-color: ${({ theme, $active }) => ($active ? theme.colors.foreground : theme.colors.background)};
  color: ${({ theme, $active }) => ($active ? theme.colors.background : theme.colors.muted)};
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme, $active }) => ($active ? theme.colors.background : theme.colors.foreground)};
  }

  &:not(:last-child) {
    border-right: 2px solid ${({ theme }) => theme.colors.border};
  }
`;

const ContentArea = styled(motion.div)`
  padding: 0 1rem 2rem;
  border-left: 2px solid ${({ theme }) => theme.colors.border};
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    padding: 0 1.5rem 2rem;
  }
`;

const Grid = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;

  @media (min-width: ${({ theme }) => theme.breakpoints.sm}) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
`;

const ReviewWrapper = styled(motion.div)`
  border: 2px solid ${({ theme }) => theme.colors.border};
  padding: 1rem;
  margin-bottom: 1rem;
`;

// --- COMPONENTS ---

const StarRating = ({ rating, size = 14 }: { rating: number; size?: number }) => (
  <div style={{ display: 'flex', gap: '0.125rem' }}>
    {[1, 2, 3, 4, 5].map((star) => (
      <IoStar
        key={star}
        size={size}
        color={star <= Math.round(rating) ? 'var(--foreground)' : 'var(--border)'}
      />
    ))}
  </div>
);

const ProfilePage = () => {
  const { username: paramUsername } = useParams<{ username?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user: currentUser } = useAuthStore();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const activeTab: Tab = (searchParams.get('tab') as Tab) || 'listings';
  const isOwnProfile = currentUser && (!paramUsername || currentUser.username === paramUsername);

  const setActiveTab = useCallback(
    (tab: Tab) => {
      setSearchParams({ tab });
    },
    [setSearchParams],
  );

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        if (isOwnProfile && currentUser) {
          setProfileUser(currentUser);
        } else if (paramUsername) {
          const res = await auth.getMe(); // In a real app this would be a getUser(username)
          setProfileUser(res.data as unknown as User);
        }
      } catch {
        setProfileUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, [paramUsername, isOwnProfile, currentUser]);

  useEffect(() => {
    if (!profileUser) return;
    if (activeTab === 'listings') {
      setListingsLoading(true);
      productsApi
        .getUserProducts(profileUser.id)
        .then((res) => setListings((res as PaginatedResponse<Product>).data ?? []))
        .catch(() => setListings([]))
        .finally(() => setListingsLoading(false));
    } else {
      setReviewsLoading(true);
      reviewsApi
        .getUserReviews(profileUser.id)
        .then((res) => setReviews((res as PaginatedResponse<Review>).data ?? []))
        .catch(() => setReviews([]))
        .finally(() => setReviewsLoading(false));
    }
  }, [profileUser, activeTab]);

  if (isLoading) {
    return (
      <PageContainer>
        <Skeleton variant="rectangular" height={200} style={{ marginBottom: '1.5rem', border: '2px solid var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <Skeleton variant="circular" height={80} width={80} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Skeleton variant="text" width={200} />
            <Skeleton variant="text" width={140} />
            <Skeleton variant="text" width={180} />
          </div>
        </div>
        <Skeleton variant="rectangular" height={48} style={{ marginBottom: '1.5rem', border: '2px solid var(--border)' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={220} style={{ border: '2px solid var(--border)' }} />
          ))}
        </div>
      </PageContainer>
    );
  }

  if (!profileUser) {
    return (
      <EmptyState
        icon={<IoPerson size={48} />}
        title="User not found"
        description="This profile does not exist or may have been removed."
      />
    );
  }

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <PageContainer>
      <motion.div initial="hidden" animate="visible" variants={containerVariants}>
        <CoverPhoto variants={itemVariants}>
          {isOwnProfile && (
            <CoverPhotoButton onClick={() => setEditModalOpen(true)}>
              <IoCamera size={18} />
            </CoverPhotoButton>
          )}
        </CoverPhoto>

        <ProfileHeader variants={itemVariants}>
          <AvatarContainer>
            {profileUser.avatarUrl ? (
              <AvatarImg src={profileUser.avatarUrl} alt={profileUser.name} />
            ) : (
              <AvatarFallback>
                <IoPerson size={36} />
              </AvatarFallback>
            )}
            {(profileUser.isVerified || profileUser.isTrustedSeller) && (
              <VerifiedBadge>
                <IoShieldCheckmark size={20} color="var(--foreground)" />
              </VerifiedBadge>
            )}
          </AvatarContainer>

          <UserInfo>
            <NameRow>
              <Name>{profileUser.name}</Name>
              {(profileUser.isVerified || profileUser.isTrustedSeller) && (
                <IoShieldCheckmark size={20} color="var(--foreground)" title="Verified" />
              )}
            </NameRow>
            <Username>@{profileUser.username}</Username>
            {profileUser.bio && <Bio>{profileUser.bio}</Bio>}
            <MetaDataRow>
              {profileUser.location && (
                <MetaItem>
                  <IoLocationSharp size={12} />
                  {profileUser.location}
                </MetaItem>
              )}
              <MetaItem>
                <IoCalendar size={12} />
                Member since {format(new Date(profileUser.createdAt), 'MMM yyyy')}
              </MetaItem>
            </MetaDataRow>
          </UserInfo>

          {isOwnProfile && (
            <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)} style={{ flexShrink: 0 }}>
              <IoPencil size={14} />
              Edit Profile
            </Button>
          )}
        </ProfileHeader>

        <TrustScoreSection variants={itemVariants}>
          <TrustScoreHeader>
            <TrustScoreLabel>Trust Score</TrustScoreLabel>
            <TrustScoreValue>{profileUser.trustScore}%</TrustScoreValue>
          </TrustScoreHeader>
          <TrustScoreBar>
            <TrustScoreFill
              initial={{ width: 0 }}
              animate={{ width: `${profileUser.trustScore}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </TrustScoreBar>
        </TrustScoreSection>

        <StatsGrid variants={itemVariants}>
          {[
            { label: 'Listings', value: listings.length },
            { label: 'Reviews', value: reviews.length },
            { label: 'Avg Rating', value: avgRating > 0 ? avgRating.toFixed(1) : '-' },
          ].map((stat) => (
            <StatBox key={stat.label}>
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatBox>
          ))}
        </StatsGrid>

        <TabsContainer variants={itemVariants}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <TabButton key={key} $active={activeTab === key} onClick={() => setActiveTab(key)}>
              <Icon size={16} />
              {label}
            </TabButton>
          ))}
        </TabsContainer>

        <ContentArea variants={itemVariants}>
          <AnimatePresence mode="wait">
            {activeTab === 'listings' ? (
              <motion.div key="listings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {listingsLoading ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={220} style={{ border: '2px solid var(--border)' }} />
                    ))}
                  </div>
                ) : listings.length === 0 ? (
                  <EmptyState icon={<IoGrid size={36} />} title="No listings yet" description={isOwnProfile ? 'Start selling by creating a listing.' : 'This user has no listings yet.'} />
                ) : (
                  <Grid variants={containerVariants} initial="hidden" animate="visible">
                    {listings.map((product) => (
                      <motion.div key={product.id} variants={itemVariants}>
                        <ProductCard product={product} />
                      </motion.div>
                    ))}
                  </Grid>
                )}
              </motion.div>
            ) : (
              <motion.div key="reviews" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                {reviewsLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} variant="rectangular" height={100} style={{ border: '2px solid var(--border)' }} />
                    ))}
                  </div>
                ) : reviews.length === 0 ? (
                  <EmptyState icon={<IoChatbubbles size={36} />} title="No reviews yet" description="This user hasn't received any reviews." />
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {reviews.map((review) => (
                      <ReviewWrapper key={review.id} variants={itemVariants}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {review.reviewer?.avatarUrl ? (
                              <img src={review.reviewer.avatarUrl} alt="" style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} />
                            ) : (
                              <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                                <IoPerson size={18} color="var(--muted)" />
                              </div>
                            )}
                            <div>
                              <p style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', margin: 0 }}>
                                {review.reviewer?.name ?? 'Anonymous'}
                              </p>
                              <div style={{ marginTop: '0.25rem' }}>
                                <StarRating rating={review.rating} />
                              </div>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', flexShrink: 0 }}>
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                          </span>
                        </div>
                        {review.comment && (
                          <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--foreground)' }}>{review.comment}</p>
                        )}
                        {review.product && (
                          <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                            on <span style={{ fontWeight: 600 }}>{review.product.title}</span>
                          </p>
                        )}
                      </ReviewWrapper>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </ContentArea>
      </motion.div>

      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Profile" size="md">
        <EditProfileForm
          user={profileUser}
          onClose={() => setEditModalOpen(false)}
          onUpdate={(updated) => setProfileUser(updated)}
        />
      </Modal>
    </PageContainer>
  );
};

const EditProfileForm = ({
  user,
  onClose,
  onUpdate,
}: {
  user: User;
  onClose: () => void;
  onUpdate: (u: User) => void;
}) => {
  const [name, setName] = useState(user.name);
  const [bio, setBio] = useState(user.bio ?? '');
  const [location, setLocation] = useState(user.location ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await auth.updateProfile({ name, bio, location, avatarUrl });
      onUpdate(res.data as User);
      onClose();
    } catch {
      setError('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input
        textarea
        label="Bio"
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        rows={3}
      />
      <Input
        label="Location"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <Input
        label="Avatar URL"
        value={avatarUrl}
        onChange={(e) => setAvatarUrl(e.target.value)}
        placeholder="https://example.com/avatar.jpg"
      />
      {error && <p style={{ fontSize: '0.875rem', color: 'var(--error)', fontWeight: 600 }}>{error}</p>}
      <div style={{ display: 'flex', gap: '0.75rem', paddingTop: '0.5rem' }}>
        <Button variant="outline" fullWidth onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" fullWidth onClick={handleSave} isLoading={saving}>
          Save Changes
        </Button>
      </div>
    </div>
  );
};

export default ProfilePage;
