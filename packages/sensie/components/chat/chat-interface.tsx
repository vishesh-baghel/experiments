'use client';

import { useChat } from 'ai/react';
import { motion } from 'framer-motion';
import { MessageList } from './message-list';
import { InputArea } from './input-area';
import { SensieAvatar } from './sensie-avatar';
import { BookOpen, Flame, Trophy } from 'lucide-react';

/**
 * ChatInterface - Main chat container with Vercel AI SDK
 *
 * Features:
 * - Streaming responses via useChat
 * - Topic context header
 * - Progress indicators
 * - Warm dojo aesthetic
 */

interface ChatInterfaceProps {
  topicId?: string;
  topicName?: string;
  conceptName?: string;
  subtopicName?: string;
  mastery?: number;
  streak?: number;
  apiEndpoint?: string;
}

export function ChatInterface({
  topicId,
  topicName,
  conceptName,
  subtopicName,
  mastery = 0,
  streak = 0,
  apiEndpoint = '/api/chat/message',
}: ChatInterfaceProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    append,
    setMessages,
  } = useChat({
    api: apiEndpoint,
    body: {
      topicId,
    },
    initialMessages: topicName
      ? []
      : [
          {
            id: 'welcome',
            role: 'assistant',
            content:
              "Hohoho! Welcome, young student! I am Sensie, your guide on this journey of learning. What topic shall we master today? Tell me what you wish to learn, and we'll begin your training!",
          },
        ],
  });

  const handleSend = (message: string) => {
    // Check if it's a command
    if (message.startsWith('/')) {
      // Handle commands differently
      append({
        role: 'user',
        content: message,
      });
    } else {
      append({
        role: 'user',
        content: message,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-[hsl(var(--background))] paper-texture">
      {/* Header with topic context */}
      <header className="flex-shrink-0 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Topic info */}
            <div className="flex items-center gap-3">
              <SensieAvatar size="sm" isThinking={isLoading} />
              <div>
                {topicName ? (
                  <>
                    <h1 className="font-semibold text-[hsl(var(--foreground))] flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-[hsl(var(--ki-orange))]" />
                      {topicName}
                    </h1>
                    {subtopicName && (
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">
                        {subtopicName}
                        {conceptName && (
                          <span className="text-[hsl(var(--ki-orange))]">
                            {' → '}{conceptName}
                          </span>
                        )}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <h1 className="font-semibold text-[hsl(var(--foreground))]">
                      The Dojo
                    </h1>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      Ready to begin your training
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Right: Stats */}
            <div className="flex items-center gap-4">
              {/* Streak */}
              {streak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-[hsl(var(--ki-orange))]/10 rounded-full"
                >
                  <Flame className="w-4 h-4 text-[hsl(var(--ki-orange))]" />
                  <span className="text-sm font-medium text-[hsl(var(--ki-orange))]">
                    {streak}
                  </span>
                </motion.div>
              )}

              {/* Mastery */}
              {topicName && (
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  <div className="w-20 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-[hsl(var(--ki-orange))] to-[hsl(var(--ki-amber))]"
                      initial={{ width: 0 }}
                      animate={{ width: `${mastery}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <span className="text-xs text-[hsl(var(--muted-foreground))] w-8">
                    {mastery}%
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <MessageList messages={messages} isLoading={isLoading} />

      {/* Error display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-2 p-3 bg-[hsl(var(--destructive))]/10 border border-[hsl(var(--destructive))]/30 rounded-lg"
        >
          <p className="text-sm text-[hsl(var(--destructive))] sensie-voice">
            Hmm, something went wrong... Even masters encounter obstacles. Let's try again.
          </p>
        </motion.div>
      )}

      {/* Input */}
      <InputArea onSend={handleSend} disabled={isLoading} />
    </div>
  );
}

export default ChatInterface;
