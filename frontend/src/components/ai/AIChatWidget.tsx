import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSparkles, HiOutlinePaperAirplane } from 'react-icons/hi2';
import { HiOutlineX } from 'react-icons/hi';
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

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4">
      <div className="rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3 max-w-[85%]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
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
      <motion.button
        onClick={() => setAIChatOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg cursor-pointer"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{
          boxShadow: [
            '0 0 0 0 rgba(0,0,0,0.4)',
            '0 0 0 12px rgba(0,0,0,0)',
            '0 0 0 0 rgba(0,0,0,0)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <HiOutlineSparkles className="h-6 w-6" />
      </motion.button>

      <AnimatePresence>
        {isAIChatOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/20"
              onClick={handleClose}
            />

            <motion.div
              initial={{ opacity: 0, y: 60, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 60, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-6 right-6 z-50 flex w-[360px] flex-col rounded-2xl border border-gray-200 bg-white shadow-xl"
              style={{ height: '500px', maxHeight: 'calc(100vh - 80px)' }}
            >
              <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-black">
                    <HiOutlineSparkles className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-black">TradlyAI</h3>
                    <p className="text-[11px] text-gray-400">AI Assistant</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-black transition-colors"
                >
                  <HiOutlineX className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 space-y-4">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} px-4`}>
                    <div
                      className={`rounded-2xl px-4 py-2.5 max-w-[85%] text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'rounded-br-sm bg-black text-white'
                          : 'rounded-bl-sm bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isLoading && <TypingIndicator />}
                <div ref={messagesEndRef} />
              </div>

              <div className="border-t border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    disabled={isLoading}
                    className="flex-1 rounded-xl border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-black placeholder-gray-400 focus:border-black focus:bg-white focus:outline-none transition-colors disabled:opacity-50"
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!input.trim() || isLoading}
                    whileTap={input.trim() && !isLoading ? { scale: 0.9 } : undefined}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
                  >
                    <HiOutlinePaperAirplane className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
