'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Check, Lock, MoreHorizontal, Archive } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Topics Page - Minimal design
 */

type TopicStatus = 'active' | 'completed' | 'queued';
type SubtopicStatus = 'completed' | 'in_progress' | 'locked';

interface Subtopic {
  id: string;
  name: string;
  status: SubtopicStatus;
}

interface Topic {
  id: string;
  name: string;
  mastery: number;
  status: TopicStatus;
  subtopics: Subtopic[];
  lastActive?: string;
}

// Mock data
const mockTopics: Topic[] = [
  {
    id: '1',
    name: 'Rust Programming',
    mastery: 75,
    status: 'active',
    lastActive: '2h ago',
    subtopics: [
      { id: '1a', name: 'Ownership', status: 'completed' },
      { id: '1b', name: 'Borrowing', status: 'in_progress' },
      { id: '1c', name: 'Lifetimes', status: 'locked' },
    ],
  },
  {
    id: '2',
    name: 'System Design',
    mastery: 30,
    status: 'active',
    lastActive: '1d ago',
    subtopics: [
      { id: '2a', name: 'Caching', status: 'completed' },
      { id: '2b', name: 'Load Balancing', status: 'in_progress' },
      { id: '2c', name: 'CAP Theorem', status: 'locked' },
    ],
  },
  {
    id: '3',
    name: 'TypeScript',
    mastery: 92,
    status: 'completed',
    subtopics: [
      { id: '3a', name: 'Type System', status: 'completed' },
      { id: '3b', name: 'Generics', status: 'completed' },
      { id: '3c', name: 'Utility Types', status: 'completed' },
    ],
  },
  {
    id: '4',
    name: 'Distributed Systems',
    mastery: 0,
    status: 'queued',
    subtopics: [],
  },
];

type FilterType = 'all' | 'active' | 'completed' | 'queued';

export default function TopicsPage() {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showNewTopic, setShowNewTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');

  const filteredTopics = mockTopics.filter(
    (topic) => filter === 'all' || topic.status === filter
  );

  const handleCreateTopic = () => {
    if (!newTopicName.trim()) return;
    // API call would go here
    setNewTopicName('');
    setShowNewTopic(false);
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-medium text-[hsl(var(--foreground))]">
              Topics
            </h1>
            <button
              onClick={() => setShowNewTopic(true)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New topic
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        {/* Filters */}
        <div className="flex gap-1 mb-6">
          {(['all', 'active', 'completed', 'queued'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize',
                filter === f
                  ? 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))]'
              )}
            >
              {f}
            </button>
          ))}
        </div>

        {/* New topic input */}
        {showNewTopic && (
          <div className="mb-6 p-4 border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))]">
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="What do you want to learn?"
              className="w-full px-3 py-2 text-sm bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-md focus:outline-none focus:border-[hsl(var(--foreground))/0.2]"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateTopic();
                if (e.key === 'Escape') setShowNewTopic(false);
              }}
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => setShowNewTopic(false)}
                className="px-3 py-1.5 text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTopic}
                disabled={!newTopicName.trim()}
                className="px-3 py-1.5 text-sm font-medium bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] rounded-md disabled:opacity-40"
              >
                Create
              </button>
            </div>
          </div>
        )}

        {/* Topics list */}
        <div className="space-y-3">
          {filteredTopics.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>

        {filteredTopics.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[hsl(var(--muted-foreground))]">
              No topics found.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

interface TopicCardProps {
  topic: Topic;
}

function TopicCard({ topic }: TopicCardProps) {
  const completedSubtopics = topic.subtopics.filter(
    (s) => s.status === 'completed'
  ).length;

  return (
    <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] hover:border-[hsl(var(--muted-foreground))/0.3] transition-colors">
      <div className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[hsl(var(--foreground))]">
              {topic.name}
            </h3>
            {topic.subtopics.length > 0 && (
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                {completedSubtopics}/{topic.subtopics.length} subtopics
                {topic.lastActive && ` · ${topic.lastActive}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--foreground))]"
                  style={{ width: `${topic.mastery}%` }}
                />
              </div>
              <span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">
                {topic.mastery}%
              </span>
            </div>
            <button className="p-1.5 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] rounded-md">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Subtopics */}
        {topic.subtopics.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[hsl(var(--border))]">
            <div className="space-y-2">
              {topic.subtopics.map((subtopic) => (
                <div
                  key={subtopic.id}
                  className="flex items-center gap-2 text-sm"
                >
                  {subtopic.status === 'completed' && (
                    <Check className="w-4 h-4 text-[hsl(var(--success))]" />
                  )}
                  {subtopic.status === 'in_progress' && (
                    <div className="w-4 h-4 border-2 border-[hsl(var(--foreground))] rounded-full" />
                  )}
                  {subtopic.status === 'locked' && (
                    <Lock className="w-4 h-4 text-[hsl(var(--muted-foreground))]" />
                  )}
                  <span
                    className={cn(
                      subtopic.status === 'locked'
                        ? 'text-[hsl(var(--muted-foreground))]'
                        : 'text-[hsl(var(--foreground))]'
                    )}
                  >
                    {subtopic.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-[hsl(var(--muted))/0.3] border-t border-[hsl(var(--border))] rounded-b-lg flex items-center justify-between">
        {topic.status === 'completed' ? (
          <>
            <button className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] flex items-center gap-1">
              <Archive className="w-4 h-4" />
              Archive
            </button>
            <Link
              href={`/review?topic=${topic.id}`}
              className="text-sm font-medium text-[hsl(var(--foreground))] hover:underline flex items-center gap-1"
            >
              Review
              <ChevronRight className="w-4 h-4" />
            </Link>
          </>
        ) : topic.status === 'queued' ? (
          <Link
            href={`/chat?topic=${topic.id}`}
            className="ml-auto text-sm font-medium text-[hsl(var(--foreground))] hover:underline flex items-center gap-1"
          >
            Start learning
            <ChevronRight className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href={`/chat?topic=${topic.id}`}
            className="ml-auto text-sm font-medium text-[hsl(var(--foreground))] hover:underline flex items-center gap-1"
          >
            Continue
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
