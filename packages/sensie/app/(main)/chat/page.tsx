'use client';

import { ChatInterface } from '@/components/chat';

/**
 * Chat Page - Main learning interface
 *
 * The heart of Sensie - where learning happens through
 * Socratic dialogue with the wise master.
 */

export default function ChatPage() {
  // In production, these would come from:
  // - URL params or session state for topicId
  // - Database queries for topic/mastery data
  // - User progress for streak

  return (
    <div className="h-screen">
      <ChatInterface
        // topicName="Rust Programming"
        // subtopicName="Ownership"
        // conceptName="Move Semantics"
        // mastery={45}
        // streak={3}
      />
    </div>
  );
}
