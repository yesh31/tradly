import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { format, formatDistanceToNow, isSameDay } from 'date-fns';
import {
  IoChatbubbles,
  IoArrowBack,
  IoSend,
  IoImage,
  IoPerson,
  IoSearch,
  IoCheckmark,
  IoCheckmarkDone,
} from 'react-icons/io5';
import type { Conversation, Message } from '@/types';
import { chat } from '@/services/api';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import {
  on,
  off,
  joinConversation,
  leaveConversation,
  startTyping,
  stopTyping,
} from '@/services/socket';
import { Skeleton, EmptyState } from '@/components/ui';

// --- STYLED COMPONENTS ---

const PageContainer = styled.div`
  height: calc(100vh - 4.5rem);
  display: flex;
  background-color: ${({ theme }) => theme.colors.background};
`;

const Sidebar = styled(motion.div)`
  width: 100%;
  flex-shrink: 0;
  border-right: 2px solid ${({ theme }) => theme.colors.border};
  display: flex;
  flex-direction: column;
  background-color: ${({ theme }) => theme.colors.background};

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    width: 24rem;
  }
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

const SidebarTitle = styled.h1`
  font-size: 1.25rem;
  font-weight: 800;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.foreground};
  margin-bottom: 0.75rem;
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.5rem 1rem 0.5rem 2.5rem;
  font-family: inherit;
  font-weight: 600;
  font-size: 0.875rem;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.secondary};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;
  transition: all 0.2s;

  &:focus {
    border-color: ${({ theme }) => theme.colors.foreground};
    background-color: ${({ theme }) => theme.colors.background};
  }
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${({ theme }) => theme.colors.muted};
  display: flex;
  align-items: center;
`;

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const ConversationItem = styled(motion.button)<{ $isActive: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  text-align: left;
  background-color: ${({ theme, $isActive }) => ($isActive ? theme.colors.foreground : theme.colors.background)};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  cursor: pointer;
  transition: all 0.2s;
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.background : theme.colors.foreground)};

  &:hover {
    background-color: ${({ theme, $isActive }) => ($isActive ? theme.colors.foreground : theme.colors.secondary)};
  }
`;

const ConvAvatar = styled.img`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const ConvAvatarFallback = styled.div<{ $isActive: boolean }>`
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 50%;
  background-color: ${({ theme, $isActive }) => ($isActive ? theme.colors.background : theme.colors.secondary)};
  border: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ theme, $isActive }) => ($isActive ? theme.colors.foreground : theme.colors.muted)};
`;

const ChatArea = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background-color: ${({ theme }) => theme.colors.background};
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  flex-shrink: 0;
`;

const ChatHeaderName = styled.p`
  font-size: 0.875rem;
  font-weight: 800;
  color: ${({ theme }) => theme.colors.foreground};
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;

  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    display: none;
  }

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const ProductThumb = styled.img`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0;
  object-fit: cover;
  flex-shrink: 0;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const MessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const DateSeparator = styled.div`
  display: flex;
  justify-content: center;
  margin: 1rem 0;
`;

const DateLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.muted};
  background-color: ${({ theme }) => theme.colors.secondary};
  padding: 0.25rem 0.75rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
`;

const MessageBubbleWrapper = styled(motion.div)<{ $isMine: boolean }>`
  display: flex;
  justify-content: ${({ $isMine }) => ($isMine ? 'flex-end' : 'flex-start')};
  margin-bottom: 0.25rem;
`;

const MessageBubble = styled.div<{ $isMine: boolean }>`
  max-width: 75%;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  line-height: 1.5;
  border: 2px solid ${({ theme }) => theme.colors.foreground};
  
  background-color: ${({ theme, $isMine }) => ($isMine ? theme.colors.foreground : theme.colors.background)};
  color: ${({ theme, $isMine }) => ($isMine ? theme.colors.background : theme.colors.foreground)};

  border-radius: ${({ $isMine }) => ($isMine ? '1rem 1rem 0 1rem' : '1rem 1rem 1rem 0')};
`;

const SystemMessage = styled.div`
  display: flex;
  justify-content: center;
  width: 100%;
  margin: 0.5rem 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.muted};
  font-style: italic;
  text-transform: uppercase;
`;

const InputArea = styled.div`
  border-top: 2px solid ${({ theme }) => theme.colors.border};
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.background};
  flex-shrink: 0;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.5rem 1rem;
  font-family: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  color: ${({ theme }) => theme.colors.foreground};
  outline: none;

  &:focus {
    border-color: ${({ theme }) => theme.colors.foreground};
  }
`;

const SendButton = styled(IconButton)`
  color: ${({ theme }) => theme.colors.foreground};
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.foreground};
    color: ${({ theme }) => theme.colors.background};
  }
`;

// --- ANIMATION VARIANTS ---

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -12 },
  visible: { opacity: 1, x: 0 },
};

const messageVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

const ChatPage = () => {
  const { conversationId: paramConversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    setConversations,
    setActiveConversation,
    addMessage,
    setMessages,
    setUnreadCount,
    updateConversationLastMessage,
  } = useChatStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileList, setShowMobileList] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({});

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const otherUser = activeConversation
    ? activeConversation.buyerId === currentUser?.id
      ? activeConversation.seller
      : activeConversation.buyer
    : null;

  const filteredConversations = conversations.filter((c) => {
    const user = c.buyerId === currentUser?.id ? c.seller : c.buyer;
    if (!user) return true;
    return user.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const sortedConversations = [...filteredConversations].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  useEffect(() => {
    chat.getConversations().then((res) => {
      const data = (res as { data?: Conversation[] }).data ?? [];
      setConversations(data);
    }).catch(() => {});
    chat.getUnreadCount().then((res) => {
      const count = (res as { data?: number }).data ?? 0;
      setUnreadCount(count);
    }).catch(() => {});
  }, [setConversations, setUnreadCount]);

  useEffect(() => {
    if (paramConversationId) {
      setActiveConversation(paramConversationId);
      setShowMobileList(false);
    }
  }, [paramConversationId, setActiveConversation]);

  useEffect(() => {
    if (!activeConversationId) return;
    joinConversation(activeConversationId);
    chat.getConversationMessages(activeConversationId).then((res) => {
      const data = res.data?.messages ?? [];
      setMessages(activeConversationId, data);
    }).catch(() => {});
    chat.markAsRead(activeConversationId).catch(() => {});
    return () => leaveConversation(activeConversationId);
  }, [activeConversationId, setMessages]);

  useEffect(() => {
    const handleNewMessage = (data: Message) => {
      if (data.conversationId === activeConversationId) {
        addMessage(data.conversationId, data);
        chat.markAsRead(data.conversationId).catch(() => {});
      }
      updateConversationLastMessage(data.conversationId, data);
      useChatStore.getState().decrementUnread();
    };
    const handleTypingStart = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConversationId && data.userId !== currentUser?.id) {
        setTypingUsers((prev) => ({ ...prev, [data.conversationId]: true }));
      }
    };
    const handleTypingStop = (data: { conversationId: string; userId: string }) => {
      if (data.conversationId === activeConversationId && data.userId !== currentUser?.id) {
        setTypingUsers((prev) => ({ ...prev, [data.conversationId]: false }));
      }
    };
    on('message:new', handleNewMessage);
    on('typing:start', handleTypingStart);
    on('typing:stop', handleTypingStop);
    return () => {
      off('message:new', handleNewMessage);
      off('typing:start', handleTypingStart);
      off('typing:stop', handleTypingStop);
    };
  }, [activeConversationId, currentUser?.id, addMessage, updateConversationLastMessage]);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    navigate(`/messages/${id}`, { replace: true });
    if (window.innerWidth < 768) setShowMobileList(false);
  };

  const handleBack = () => {
    setShowMobileList(true);
    navigate('/messages', { replace: true });
  };

  return (
    <PageContainer>
      <AnimatePresence mode="wait">
        {(showMobileList || window.innerWidth >= 768) && (
          <Sidebar
            key="conversations-list"
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <SidebarHeader>
              <SidebarTitle>Chats</SidebarTitle>
              <SearchContainer>
                <SearchIconWrapper>
                  <IoSearch size={16} />
                </SearchIconWrapper>
                <SearchInput
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </SearchContainer>
            </SidebarHeader>

            <ListContainer>
              {isLoading ? (
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Skeleton variant="circular" height={44} width={44} style={{ flexShrink: 0 }} />
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <Skeleton variant="text" width={120} />
                        <Skeleton variant="text" width={180} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedConversations.length === 0 ? (
                <EmptyState icon={<IoChatbubbles size={36} />} title="No conversations" description="Start a chat from a product listing." />
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  {sortedConversations.map((conv) => {
                    const user = conv.buyerId === currentUser?.id ? conv.seller : conv.buyer;
                    const isActive = conv.id === activeConversationId;
                    const unread = conv.unreadCount ?? 0;
                    return (
                      <ConversationItem
                        key={conv.id}
                        variants={itemVariants}
                        onClick={() => handleSelectConversation(conv.id)}
                        $isActive={isActive}
                      >
                        {user?.avatarUrl ? (
                          <ConvAvatar src={user.avatarUrl} alt="" />
                        ) : (
                          <ConvAvatarFallback $isActive={isActive}>
                            <IoPerson size={20} />
                          </ConvAvatarFallback>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.875rem', fontWeight: 800, textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {user?.name ?? 'Unknown'}
                            </span>
                            {conv.lastMessage && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: isActive ? 'var(--background)' : 'var(--muted)', flexShrink: 0, marginLeft: '0.5rem', textTransform: 'uppercase' }}>
                                {formatDistanceToNow(new Date(conv.lastMessage.createdAt))}
                              </span>
                            )}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.125rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isActive ? 'var(--background)' : 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {conv.lastMessage?.content ?? (conv.lastMessage?.imageUrl ? 'Image' : 'No messages yet')}
                            </span>
                            {unread > 0 && (
                              <span style={{ marginLeft: '0.5rem', backgroundColor: 'var(--error)', color: 'white', fontSize: '0.65rem', padding: '0.125rem 0.375rem', fontWeight: 800, border: '1px solid var(--border)' }}>
                                {unread}
                              </span>
                            )}
                          </div>
                        </div>
                      </ConversationItem>
                    );
                  })}
                </motion.div>
              )}
            </ListContainer>
          </Sidebar>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {(!showMobileList || window.innerWidth >= 768) && (
          <ChatArea
            key="chat-area"
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            {activeConversation && otherUser ? (
              <>
                <ChatHeader>
                  <BackButton onClick={handleBack}>
                    <IoArrowBack size={20} />
                  </BackButton>
                  {otherUser.avatarUrl ? (
                    <ConvAvatar src={otherUser.avatarUrl} alt="" style={{ width: '2.5rem', height: '2.5rem' }} />
                  ) : (
                    <ConvAvatarFallback $isActive={false} style={{ width: '2.5rem', height: '2.5rem' }}>
                      <IoPerson size={16} />
                    </ConvAvatarFallback>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <ChatHeaderName>
                      {otherUser.name}
                    </ChatHeaderName>
                    {activeConversation.product && (
                      <p style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0 }}>
                        RE: {activeConversation.product.title}
                      </p>
                    )}
                  </div>
                  {activeConversation.product?.images?.[0]?.url && (
                    <ProductThumb src={activeConversation.product.images[0].url} alt="" />
                  )}
                </ChatHeader>

                <MessagesContainer>
                  <MessagesList messages={activeConversationId ? (messages[activeConversationId] ?? []) : []} currentUserId={currentUser?.id ?? ''} />
                  {activeConversationId && typingUsers[activeConversationId] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic', fontWeight: 600, textTransform: 'uppercase' }}>
                      <div style={{ width: '1.5rem', height: '1.5rem', backgroundColor: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border)' }}>
                        <IoPerson size={10} />
                      </div>
                      {otherUser?.name} is typing...
                    </div>
                  )}
                </MessagesContainer>

                {activeConversationId && (
                  <ChatInput conversationId={activeConversationId} onSend={() => { stopTyping({ conversationId: activeConversationId }); }} />
                )}
              </>
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EmptyState icon={<IoChatbubbles size={48} />} title="Select a conversation" description="Select a conversation to start chatting" />
              </div>
            )}
          </ChatArea>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};

const MessagesList = ({ messages, currentUserId }: { messages: Message[]; currentUserId: string }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const grouped: { date: string; messages: Message[] }[] = [];
  messages.forEach((msg) => {
    const dateKey = format(new Date(msg.createdAt), 'yyyy-MM-dd');
    const last = grouped[grouped.length - 1];
    if (last && last.date === dateKey) {
      last.messages.push(msg);
    } else {
      grouped.push({ date: dateKey, messages: [msg] });
    }
  });

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible">
      {grouped.map((group) => (
        <div key={group.date}>
          <DateSeparator>
            <DateLabel>
              {isSameDay(new Date(group.date), new Date()) ? 'Today' : format(new Date(group.date), 'MMM d, yyyy')}
            </DateLabel>
          </DateSeparator>
          {group.messages.map((msg) => {
            const isMine = msg.senderId === currentUserId;
            return (
              <MessageBubbleWrapper key={msg.id} variants={messageVariants} $isMine={isMine}>
                {msg.type === 'SYSTEM' ? (
                  <SystemMessage>{msg.content}</SystemMessage>
                ) : (
                  <MessageBubble $isMine={isMine}>
                    {msg.imageUrl && (
                      <img src={msg.imageUrl} alt="Shared" style={{ maxWidth: '100%', border: '2px solid var(--background)', marginBottom: '0.25rem' }} />
                    )}
                    {msg.content && <p style={{ margin: 0 }}>{msg.content}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', justifyContent: isMine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.65rem', fontWeight: 700, opacity: 0.8 }}>
                        {format(new Date(msg.createdAt), 'h:mm a')}
                      </span>
                      {isMine && (msg.isRead ? <IoCheckmarkDone size={12} style={{ opacity: 0.8 }} /> : <IoCheckmark size={12} style={{ opacity: 0.8 }} />)}
                    </div>
                  </MessageBubble>
                )}
              </MessageBubbleWrapper>
            );
          })}
        </div>
      ))}
      <div ref={bottomRef} />
    </motion.div>
  );
};

const ChatInput = ({ conversationId, onSend }: { conversationId: string; onSend: () => void }) => {
  const [text, setText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [sending, setSending] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (isTyping) {
        startTyping({ conversationId });
      } else {
        stopTyping({ conversationId });
      }
    },
    [conversationId],
  );

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);
    emitTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => emitTyping(false), 2000);
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    emitTyping(false);
    try {
      await chat.sendMessage(conversationId, { content: text.trim(), type: 'TEXT' });
      setText('');
      onSend();
    } catch {
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSending(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      const { url } = await uploadRes.json();
      await chat.sendMessage(conversationId, { imageUrl: url, type: 'IMAGE' });
    } catch {
    } finally {
      setSending(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <InputArea>
      <InputWrapper>
        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageUpload} style={{ display: 'none' }} />
        <IconButton onClick={() => fileInputRef.current?.click()} disabled={sending}>
          <IoImage size={24} />
        </IconButton>
        <MessageInput type="text" value={text} onChange={handleTextChange} onKeyDown={handleKeyDown} placeholder="TYPE A MESSAGE..." />
        <SendButton onClick={handleSend} disabled={!text.trim() || sending}>
          <IoSend size={20} />
        </SendButton>
      </InputWrapper>
    </InputArea>
  );
};

export default ChatPage;
