'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { ChatInterface } from '@/components/chat/chat-interface';

/**
 * Chat Page - Main learning interface
 *
 * The heart of Sensie - where learning happens through
 * Socratic dialogue with the wise master.
 */

interface Topic {
  id: string;
  name: string;
  goal?: string;
  masteryPercentage: number;
  status: string;
  subtopics?: Array<{
    id: string;
    name: string;
    isLocked: boolean;
    mastery: number;
  }>;
}

export default function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = searchParams.get('topic');

  const [loading, setLoading] = useState(!!topicId);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopic() {
      if (!topicId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/topics/${topicId}`);

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          if (response.status === 404) {
            throw new Error('Topic not found');
          }
          if (response.status === 403) {
            throw new Error('Access denied');
          }
          throw new Error('Failed to load topic');
        }

        const data = await response.json();
        setTopic(data.topic);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load topic');
      } finally {
        setLoading(false);
      }
    }

    fetchTopic();
  }, [topicId, router]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--muted-foreground))]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[hsl(var(--background))]">
        <div className="text-center">
          <p className="text-[hsl(var(--destructive))] mb-4">{error}</p>
          <button
            onClick={() => router.push('/topics')}
            className="text-[hsl(var(--primary))] hover:underline"
          >
            Go to Topics
          </button>
        </div>
      </div>
    );
  }

  // Get current subtopic if topic has subtopics
  const currentSubtopic = topic?.subtopics?.find(
    (st) => !st.isLocked && st.mastery < 80
  );

  return (
    <div className="h-screen">
      <ChatInterface
        topicId={topic?.id}
        topicName={topic?.name}
        subtopicName={currentSubtopic?.name}
        mastery={topic?.masteryPercentage}
      />
    </div>
  );
}
