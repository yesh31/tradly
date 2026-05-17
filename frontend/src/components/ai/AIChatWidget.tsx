import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
import styled from 'styled-components';
import { useUIStore } from '@/store/uiStore';
import { ai } from '@/services/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  content: string;
  timestamp: number;
}

function generateId() {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const WidgetButton = styled(motion.button)`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 40;
  display: flex;
  height: 3.5rem;
  width: 3.5rem;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  box-shadow: 4px 4px 0px 0px ${({ theme }) => theme.colors.foreground};
  cursor: pointer;
  
  svg {
    width: 24px;
    height: 24px;
    display: block;
  }
`;

const Overlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.2);
`;

const ChatContainer = styled(motion.div)`
  position: fixed;
  bottom: 1.5rem;
  right: 1.5rem;
  z-index: 50;
  display: flex;
  width: 360px;
  flex-direction: column;
  border-radius: 0;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.background};
  box-shadow: 8px 8px 0px 0px ${({ theme }) => theme.colors.primary};
  height: 500px;
  max-height: calc(100vh - 80px);
`;

const ChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
  padding: 1rem 1.25rem;
  background-color: ${({ theme }) => theme.colors.background};
`;

const HeaderIcon = styled.div`
  display: flex;
  height: 2rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
`;

const HeaderTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.foreground};
  text-transform: uppercase;
`;

const HeaderSubtitle = styled.p`
  font-size: 0.6875rem;
  color: ${({ theme }) => theme.colors.muted};
  text-transform: uppercase;
`;

const CloseButton = styled.button`
  padding: 0.375rem;
  color: ${({ theme }) => theme.colors.muted};
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    color: ${({ theme }) => theme.colors.foreground};
  }
`;

const ChatBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageWrapper = styled.div<{ $isUser: boolean }>`
  display: flex;
  justify-content: ${({ $isUser }) => ($isUser ? 'flex-end' : 'flex-start')};
  padding: 0 1rem;
`;

const MessageBubble = styled.div<{ $isUser: boolean }>`
  padding: 0.625rem 1rem;
  max-width: 85%;
  font-size: 0.875rem;
  line-height: 1.5;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ $isUser, theme }) =>
    $isUser ? theme.colors.primary : theme.colors.secondary};
  color: ${({ $isUser, theme }) =>
    $isUser ? theme.colors.background : theme.colors.foreground};
  border-radius: 0;
`;

const ChatFooter = styled.div`
  border-top: 2px solid ${({ theme }) => theme.colors.border};
  padding: 0.75rem 1rem;
  background-color: ${({ theme }) => theme.colors.background};
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChatInput = styled.input`
  flex: 1;
  border: 2px solid ${({ theme }) => theme.colors.border};
  background-color: ${({ theme }) => theme.colors.secondary};
  padding: 0.625rem 1rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.foreground};
  border-radius: 0;
  transition: all 0.2s;

  &::placeholder {
    color: ${({ theme }) => theme.colors.muted};
  }

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    background-color: ${({ theme }) => theme.colors.background};
  }

  &:disabled {
    opacity: 0.5;
  }
`;

const SendBtn = styled(motion.button)`
  display: flex;
  height: 2.5rem;
  width: 2.5rem;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.background};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  border-radius: 0;
  cursor: pointer;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function TypingIndicator() {
  return (
    <MessageWrapper $isUser={false}>
      <MessageBubble $isUser={false} style={{ display: 'flex', gap: '0.375rem', alignItems: 'center' }}>
        <div style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite' }} />
        <div style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite 150ms' }} />
        <div style={{ height: '8px', width: '8px', borderRadius: '50%', backgroundColor: 'currentColor', animation: 'bounce 1s infinite 300ms' }} />
      </MessageBubble>
    </MessageWrapper>
  );
}

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'bot',
  content: "Hi! I'm TradlyAI. How can I help you today?",
  timestamp: Date.now(),
};

export default function AIChatWidget() {
  const { isAIChatOpen, setAIChatOpen } = useUIStore();
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isAIChatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isAIChatOpen]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await ai.chatWithAI({ message: text });
      const reply = response.data?.reply ?? 'Sorry, I could not process that.';

      const botMessage: ChatMessage = {
        id: generateId(),
        role: 'bot',
        content: reply,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'bot',
        content: 'Something went wrong. Please try again.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setAIChatOpen(false);
  };

  return (
    <>
      <WidgetButton
        onClick={() => setAIChatOpen(true)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <HiOutlineSparkles className="h-6 w-6" />
      </WidgetButton>

      <AnimatePresence>
        {isAIChatOpen && (
          <>
            <Overlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleClose}
            />

            <ChatContainer
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              <ChatHeader>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                  <HeaderIcon>
                    <HiOutlineSparkles className="h-4 w-4" />
                  </HeaderIcon>
                  <div>
                    <HeaderTitle>TradlyAI</HeaderTitle>
                    <HeaderSubtitle>AI Assistant</HeaderSubtitle>
                  </div>
                </div>
                <CloseButton onClick={handleClose}>
                  <HiOutlineX className="h-5 w-5" />
                </CloseButton>
              </ChatHeader>

              <ChatBody>
                {messages.map((msg) => (
                  <MessageWrapper key={msg.id} $isUser={msg.role === 'user'}>
                    <MessageBubble $isUser={msg.role === 'user'}>
                      {msg.content}
                    </MessageBubble>
                  </MessageWrapper>
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </ChatBody>

              <ChatFooter>
                <InputWrapper>
                  <ChatInput
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isLoading}
                  />
                  <SendBtn
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    whileTap={input.trim() && !isLoading ? { scale: 0.9 } : undefined}
                  >
                    <HiOutlinePaperAirplane className="h-4 w-4" />
                  </SendBtn>
                </InputWrapper>
              </ChatFooter>
            </ChatContainer>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
