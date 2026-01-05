'use client';

import { MessageList, type Message } from './message-list';
import { InputArea } from './input-area';

/**
 * ChatInterface - Main chat container component
 *
 * Props:
 * - sessionId: Current learning session ID
 * - topicName: Name of current topic (optional)
 * - onSendMessage: Handler for sending messages
 */

export interface ChatInterfaceProps {
  sessionId?: string;
  topicName?: string;
  conceptName?: string;
  messages?: Message[];
  isLoading?: boolean;
  onSendMessage?: (message: string) => void;
}

export function ChatInterface({
  sessionId,
  topicName,
  conceptName,
  messages = [],
  isLoading = false,
  onSendMessage,
}: ChatInterfaceProps) {
  const handleSend = (message: string) => {
    if (onSendMessage) {
      onSendMessage(message);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Context header */}
      {topicName && (
        <div className="px-4 py-2 border-b bg-muted/50">
          <p className="text-sm font-medium">{topicName}</p>
          {conceptName && (
            <p className="text-xs text-muted-foreground">
              Current: {conceptName}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} isLoading={isLoading} />
      </div>

      {/* Input */}
      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default ChatInterface;
