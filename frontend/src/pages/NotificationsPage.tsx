import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { formatDistanceToNow } from 'date-fns';
import {
  IoNotifications,
  IoCheckmarkDone,
  IoCheckmark,
  IoGolf,
  IoHammer,
  IoChatbubble,
  IoCart,
  IoHeart,
  IoPersonAdd,
  IoWarning,
  IoTime,
  IoArrowForward,
} from 'react-icons/io5';
import type { Notification, PaginatedResponse } from '@/types';
import { notifications as notifApi } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Button, Skeleton, EmptyState } from '@/components/ui';

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  max-width: 42rem;
  margin: 0 auto;
  padding: 2rem 1rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
`;

const UnreadBadge = styled.span`
  background-color: ${({ theme }) => theme.colors.foreground};
  color: ${({ theme }) => theme.colors.background};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  padding: 0.125rem 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const NotificationList = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const NotificationItem = styled(motion.div)<{ $isRead: boolean; $isDismissing: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme, $isRead }) => ($isRead ? theme.colors.background : theme.colors.secondary)};
  cursor: pointer;
  transition: all 0.2s;
  pointer-events: ${({ $isDismissing }) => ($isDismissing ? 'none' : 'auto')};
  opacity: ${({ $isDismissing }) => ($isDismissing ? 0.5 : 1)};

  &:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px ${({ theme }) => theme.colors.border};
  }
`;

const IconWrapper = styled.div<{ $isRead: boolean }>`
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme, $isRead }) => ($isRead ? theme.colors.background : theme.colors.foreground)};
  color: ${({ theme, $isRead }) => ($isRead ? theme.colors.muted : theme.colors.background)};
  border: 2px solid ${({ theme }) => theme.colors.border};
`;

const ContentWrapper = styled.div`
  flex: 1;
  min-width: 0;
`;

const NotificationTitle = styled.p<{ $isRead: boolean }>`
  font-size: 0.875rem;
  font-weight: ${({ $isRead }) => ($isRead ? 600 : 800)};
  color: ${({ theme }) => theme.colors.foreground};
  text-transform: uppercase;
  margin: 0;
`;

const NotificationMessage = styled.p`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  margin: 0.25rem 0 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const NotificationTime = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
  margin: 0.25rem 0 0;
`;

const ActionWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

const UnreadDot = styled.span`
  width: 0.5rem;
  height: 0.5rem;
  background-color: ${({ theme }) => theme.colors.foreground};
  border-radius: 50%;
`;

const LoadMoreContainer = styled.div`
  display: flex;
  justify-content: center;
  padding-top: 1.5rem;
`;

// --- ANIMATION VARIANTS ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

const notificationIcons: Record<string, typeof IoNotifications> = {
  BID_RECEIVED: IoGolf,
  BID_OUTBID: IoHammer,
  AUCTION_WON: IoCheckmark,
  AUCTION_ENDING: IoTime,
  NEW_MESSAGE: IoChatbubble,
  PRODUCT_SOLD: IoCart,
  PRODUCT_LIKED: IoHeart,
  FOLLOW: IoPersonAdd,
  SYSTEM: IoWarning,
};

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    setNotifications,
    markAsRead,
    markAllAsRead: markAllLocal,
  } = useNotificationStore();

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [dismissingId, setDismissingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      useNotificationStore.getState().setLoading(true);
      try {
        const res = await notifApi.getNotifications(page);
        const data = res as PaginatedResponse<Notification>;
        if (page === 1) {
          setNotifications(data.data);
        } else {
          const existing = useNotificationStore.getState().notifications;
          setNotifications([...existing, ...data.data]);
        }
        setTotalPages(data.totalPages);
      } catch {
      } finally {
        useNotificationStore.getState().setLoading(false);
      }
    };
    fetch();
  }, [page, user, setNotifications]);

  const handleMarkAllAsRead = async () => {
    try {
      await notifApi.markAllAsRead();
      markAllLocal();
    } catch {
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      setDismissingId(notification.id);
      try {
        await notifApi.markAsRead(notification.id);
        markAsRead(notification.id);
      } catch {
      } finally {
        setDismissingId(null);
      }
    }
    if (notification.data?.productId) {
      navigate(`/products/${notification.data.productId}`);
    } else if (notification.type === 'NEW_MESSAGE' && notification.data?.conversationId) {
      navigate(`/messages/${notification.data.conversationId}`);
    }
  };

  const handleLoadMore = () => {
    if (page < totalPages && !loadingMore) {
      setLoadingMore(true);
      setPage((p) => p + 1);
    }
  };

  useEffect(() => {
    if (page > 1) setLoadingMore(false);
  }, [notifications]);

  if (isLoading && page === 1) {
    return (
      <PageContainer>
        <Header>
          <Title>Notifications</Title>
        </Header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '2px solid var(--border)' }}>
              <Skeleton variant="circular" height={40} width={40} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Skeleton variant="text" width={160} />
                <Skeleton variant="text" width={240} />
              </div>
            </div>
          ))}
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Header>
        <TitleWrapper>
          <Title>Notifications</Title>
          {unreadCount > 0 && <UnreadBadge>{unreadCount} new</UnreadBadge>}
        </TitleWrapper>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllAsRead} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <IoCheckmarkDone size={16} /> Mark all read
          </Button>
        )}
      </Header>

      <AnimatePresence mode="wait">
        {notifications.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <EmptyState
              icon={<IoNotifications size={48} />}
              title="No notifications"
              description="You're all caught up! Notifications will appear here."
            />
          </motion.div>
        ) : (
          <NotificationList key="list" variants={containerVariants} initial="hidden" animate="visible">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] ?? IoNotifications;
              return (
                <NotificationItem
                  key={notification.id}
                  variants={itemVariants}
                  layout
                  onClick={() => handleNotificationClick(notification)}
                  $isRead={notification.isRead}
                  $isDismissing={dismissingId === notification.id}
                >
                  <IconWrapper $isRead={notification.isRead}>
                    <Icon size={18} />
                  </IconWrapper>

                  <ContentWrapper>
                    <NotificationTitle $isRead={notification.isRead}>{notification.title}</NotificationTitle>
                    <NotificationMessage>{notification.message}</NotificationMessage>
                    <NotificationTime>{formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}</NotificationTime>
                  </ContentWrapper>

                  <ActionWrapper>
                    {!notification.isRead && <UnreadDot />}
                    <IoArrowForward size={16} color="var(--muted)" />
                  </ActionWrapper>
                </NotificationItem>
              );
            })}

            {page < totalPages && (
              <LoadMoreContainer>
                <Button variant="outline" size="sm" onClick={handleLoadMore} isLoading={loadingMore}>
                  Load more
                </Button>
              </LoadMoreContainer>
            )}
          </NotificationList>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

export default NotificationsPage;
