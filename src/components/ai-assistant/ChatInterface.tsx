import { toast } from 'sonner';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Mic, Sparkles, User, CheckCircle2 } from 'lucide-react';
import type { ChatMessage, AiInsightCardData } from '@/data/mockData';
import { cn } from '@/lib/utils';

const ease = [0.25, 0.1, 0.25, 1] as [number, number, number, number];

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      <motion.div
        className="h-2 w-2 rounded-full bg-[#A855F7]"
        animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-[#A855F7]"
        animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.15 }}
      />
      <motion.div
        className="h-2 w-2 rounded-full bg-[#A855F7]"
        animate={{ scale: [0.5, 1, 0.5], opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
      />
    </div>
  );
}

function InsightCard({ card }: { card: AiInsightCardData }) {
  const borderColor =
    card.type === 'risk'
      ? 'border-l-destructive'
      : card.type === 'warning'
        ? 'border-l-[#F97316]'
        : card.type === 'success'
          ? 'border-l-[#22C55E]'
          : 'border-l-primary';

  return (
    <motion.div
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease }}
      className={cn(
        'mt-2 rounded-lg border-l-2 bg-card p-3',
        borderColor
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-foreground">{card.title}</span>
        {card.value && (
          <span
            className={cn(
              'font-mono text-sm font-bold',
              card.type === 'risk'
                ? 'text-destructive'
                : card.type === 'warning'
                  ? 'text-[#F97316]'
                  : 'text-[#22C55E]'
            )}
          >
            {card.value}
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{card.description}</p>
    </motion.div>
  );
}

export default function ChatInterface({ messages, onSendMessage }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full min-h-[500px] flex-col rounded-2xl bg-card border border-border">
      {/* Chat messages area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        style={{ maxHeight: '60vh' }}
      >
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        {isTyping && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-start gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A855F7] to-[#3B82F6]">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="rounded-2xl rounded-tl-sm bg-transparent">
              <TypingIndicator />
            </div>
          </motion.div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border p-4">
        <div className="flex items-end gap-3">
          <button
            onClick={() => toast.info('功能开发中，敬请期待', { duration: 2000 })}
            className="mb-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          <div className="relative flex-1">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="询问 AI 关于团队、任务或项目的问题..."
              className="w-full resize-none rounded-xl bg-muted border border-border px-4 py-3 pr-10 text-sm text-foreground placeholder-[#94A3B8] outline-none transition-all focus:border-accent focus:ring-1 focus:ring-[#06B6D4]/20"
              rows={2}
            />
          </div>
          <button
            onClick={() => toast.info('功能开发中，敬请期待', { duration: 2000 })}
            className="mb-3 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Mic className="h-5 w-5" />
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            className="mb-2 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-[#A855F7] to-[#3B82F6] text-primary-foreground shadow-lg transition-shadow hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
          >
            <Send className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function ChatMessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === 'system') {
    return (
      <motion.div
        initial={{ y: -10, scale: 0.95, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="mx-auto max-w-md rounded-lg border border-[rgba(168,85,247,0.3)] bg-[rgba(168,85,247,0.1)] px-4 py-3 text-center"
      >
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-[#A855F7]" />
          <span className="text-sm text-foreground">{message.content}</span>
        </div>
        {message.actions && message.actions.length > 0 && (
          <button
            onClick={() => toast.success('AI 报告生成中...')}
            className="mt-2 text-xs font-medium text-[#A855F7] hover:underline"
          >
            查看报告
          </button>
        )}
      </motion.div>
    );
  }

  if (message.role === 'user') {
    return (
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.3, ease }}
        className="flex justify-end"
      >
        <div className="flex items-start gap-3 max-w-[70%]">
          <div className="rounded-xl rounded-tr-sm bg-muted px-4 py-3">
            <p className="whitespace-pre-wrap text-sm text-foreground">{message.content}</p>
            <span className="mt-1 block text-right text-[10px text-muted-foreground">{message.timestamp}</span>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
            <User className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </motion.div>
    );
  }

  // AI message
  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3, ease }}
      className="flex items-start gap-3 max-w-[85%]"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#A855F7] via-[#3B82F6] to-[#06B6D4]">
        <Sparkles className="h-4 w-4 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-foreground">统御 AI</span>
          <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
        </div>
        <div className="rounded-xl rounded-tl-sm bg-transparent">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {message.content}
          </p>
        </div>
        {message.cards && message.cards.length > 0 && (
          <div className="space-y-2 mt-2">
            {message.cards.map((card, i) => (
              <InsightCard key={i} card={card} />
            ))}
          </div>
        )}
        {message.actions && message.actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {message.actions.map((action) => (
              <motion.button
                key={action.action}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => toast.success(`正在${action.label}...`)}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-[#A855F7] to-[#3B82F6] px-3 py-1.5 text-xs font-medium text-primary-foreground transition-shadow hover:shadow-[0_0_12px_rgba(168,85,247,0.25)]"
              >
                <CheckCircle2 className="h-3 w-3" />
                {action.label}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
