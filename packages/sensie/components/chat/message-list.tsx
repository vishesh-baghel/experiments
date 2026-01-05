'use client';

/**
 * MessageList - Renders chat messages
 *
 * Message types:
 * - user: User messages
 * - assistant: Sensie responses
 * - system: System messages (topic changes, etc.)
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: {
    questionId?: string;
    isCorrect?: boolean;
    depth?: 'SHALLOW' | 'MODERATE' | 'DEEP';
  };
}

export interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <p>Start a conversation with Sensie!</p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && (
        <div className="flex gap-2 items-center text-muted-foreground">
          <div className="animate-pulse">Sensie is thinking...</div>
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
  const isSystem = message.role === 'system';

  if (isSystem) {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] p-4 rounded-lg ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted'
        }`}
      >
        {!isUser && (
          <p className="text-xs font-semibold mb-1 opacity-70">Sensie</p>
        )}
        <p className="whitespace-pre-wrap">{message.content}</p>
        {message.metadata?.isCorrect !== undefined && (
          <div className="mt-2 text-xs opacity-70">
            {message.metadata.isCorrect ? '✓ Correct' : '✗ Not quite'}
            {message.metadata.depth && ` (${message.metadata.depth})`}
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageList;
