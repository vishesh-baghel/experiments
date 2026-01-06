'use client';

import { useEffect, useRef } from 'react';
import type { Message } from 'ai';
import { cn } from '@/lib/utils';

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-4 py-6 space-y-6"
    >
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}

      {isLoading && (
        <div className="flex gap-1 items-center text-sm text-[hsl(var(--muted-foreground))]">
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse" />
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-current rounded-full animate-pulse [animation-delay:300ms]" />
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'max-w-[85%]',
        isUser ? 'ml-auto' : 'mr-auto'
      )}
    >
      <div
        className={cn(
          'px-4 py-3 rounded-lg text-[15px] leading-relaxed',
          isUser
            ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
            : 'bg-[hsl(var(--card))] border border-[hsl(var(--border))]'
        )}
      >
        <div className="prose prose-sm max-w-none dark:prose-invert">
          {message.content}
        </div>
      </div>
      <p className={cn(
        'text-xs text-[hsl(var(--muted-foreground))] mt-1',
        isUser ? 'text-right' : 'text-left'
      )}>
        {isUser ? 'You' : 'Sensie'}
      </p>
    </div>
  );
}

export default MessageList;
