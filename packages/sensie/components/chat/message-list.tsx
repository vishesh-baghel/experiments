'use client';

import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SensieAvatar } from './sensie-avatar';
import type { Message } from 'ai';

/**
 * MessageList - Renders chat messages in a dojo scroll aesthetic
 *
 * Features:
 * - Sensie messages with wise typography and avatar
 * - User messages aligned right
 * - System messages as subtle dividers
 * - Streaming support with typing indicator
 * - Auto-scroll to bottom
 */

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="text-center max-w-md"
        >
          <SensieAvatar size="lg" className="mx-auto mb-6" />
          <h2 className="sensie-voice text-2xl font-medium text-[hsl(var(--foreground))] mb-3">
            Welcome to the Dojo
          </h2>
          <p className="text-[hsl(var(--muted-foreground))] leading-relaxed">
            I am Sensie, your guide on this journey of learning.
            What shall we master today?
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 scroll-fade-y"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => (
            <MessageBubble
              key={message.id}
              message={message}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* Typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-start gap-3"
          >
            <SensieAvatar size="sm" isThinking />
            <div className="bg-[hsl(var(--secondary))] rounded-2xl rounded-tl-sm px-4 py-3 paper-texture">
              <ThinkingIndicator />
            </div>
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

function MessageBubble({ message, index }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex justify-center py-4"
      >
        <div className="flex items-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-[hsl(var(--border))]" />
          <span className="text-xs uppercase tracking-widest text-[hsl(var(--muted-foreground))] font-medium">
            {message.content}
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-[hsl(var(--border))]" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar for Sensie */}
      {!isUser && <SensieAvatar size="sm" />}

      {/* Message bubble */}
      <div
        className={`
          relative max-w-[85%] md:max-w-[75%]
          ${isUser
            ? 'bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white rounded-2xl rounded-tr-sm'
            : 'bg-[hsl(var(--secondary))] paper-texture rounded-2xl rounded-tl-sm border border-[hsl(var(--border))]'
          }
          px-4 py-3 shadow-sm
        `}
      >
        {/* Sensie name tag */}
        {!isUser && (
          <span className="text-xs font-medium text-[hsl(var(--ki-orange))] mb-1 block">
            Sensie
          </span>
        )}

        {/* Message content */}
        <div
          className={`
            ${!isUser ? 'sensie-voice' : ''}
            text-[0.95rem] leading-relaxed
            prose prose-sm max-w-none
            ${isUser
              ? 'prose-invert'
              : 'prose-stone prose-p:my-2 prose-headings:text-[hsl(var(--foreground))]'
            }
          `}
        >
          <MessageContent content={message.content} />
        </div>

        {/* Decorative corner for Sensie messages */}
        {!isUser && (
          <div className="absolute -left-1 top-3 w-2 h-2 bg-[hsl(var(--secondary))] rotate-45 border-l border-b border-[hsl(var(--border))]" />
        )}
      </div>

      {/* User avatar placeholder (just spacing) */}
      {isUser && <div className="w-8" />}
    </motion.div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Simple markdown-like rendering
  // In production, use react-markdown or similar
  const lines = content.split('\n');

  return (
    <>
      {lines.map((line, i) => {
        // Code blocks
        if (line.startsWith('```')) {
          return null; // Handle code blocks separately in production
        }

        // Bold text
        const boldRegex = /\*\*(.*?)\*\*/g;
        const processedLine = line.replace(
          boldRegex,
          '<strong>$1</strong>'
        );

        // Inline code
        const codeRegex = /`(.*?)`/g;
        const finalLine = processedLine.replace(
          codeRegex,
          '<code class="bg-[hsl(var(--muted))] px-1.5 py-0.5 rounded text-sm font-mono">$1</code>'
        );

        if (line.trim() === '') {
          return <br key={i} />;
        }

        return (
          <p
            key={i}
            dangerouslySetInnerHTML={{ __html: finalLine }}
          />
        );
      })}
    </>
  );
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      <span className="text-xs text-[hsl(var(--muted-foreground))] mr-2 sensie-voice italic">
        contemplating
      </span>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full bg-[hsl(var(--ki-orange))]"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default MessageList;
