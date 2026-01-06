'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  BookOpen,
  Trophy,
  Clock,
  CheckCircle2,
  Archive,
  Play,
  Loader2,
  Target,
} from 'lucide-react';
import { SensieAvatar } from '@/components/chat/sensie-avatar';

/**
 * Topics Page - Learning paths management
 *
 * Features:
 * - Active topics (max 3)
 * - Completed topics archive
 * - New topic creation modal
 * - Progress visualization
 */

// Mock data - replace with real data from API
const mockTopics = {
  active: [
    {
      id: '1',
      name: 'Rust Programming',
      status: 'ACTIVE',
      mastery: 45,
      subtopicsComplete: 3,
      subtopicsTotal: 8,
      lastActive: '2 hours ago',
      currentSubtopic: 'Ownership & Borrowing',
    },
    {
      id: '2',
      name: 'System Design',
      status: 'ACTIVE',
      mastery: 20,
      subtopicsComplete: 1,
      subtopicsTotal: 10,
      lastActive: 'Yesterday',
      currentSubtopic: 'Scalability Basics',
    },
  ],
  completed: [
    {
      id: '3',
      name: 'TypeScript Fundamentals',
      status: 'COMPLETED',
      mastery: 92,
      completedDate: '2 weeks ago',
    },
  ],
  archived: [],
};

export default function TopicsPage() {
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const canAddTopic = mockTopics.active.length < 3;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] paper-texture">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SensieAvatar size="sm" />
              <div>
                <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                  Training Grounds
                </h1>
                <p className="text-sm text-[hsl(var(--muted-foreground))]">
                  Manage your learning paths
                </p>
              </div>
            </div>

            <motion.button
              onClick={() => canAddTopic && setShowNewTopicModal(true)}
              disabled={!canAddTopic}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium
                ${canAddTopic
                  ? 'bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white shadow-lg hover:shadow-xl'
                  : 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] cursor-not-allowed'
                }
                transition-all duration-200
              `}
              whileHover={canAddTopic ? { scale: 1.02 } : {}}
              whileTap={canAddTopic ? { scale: 0.98 } : {}}
            >
              <Plus className="w-5 h-5" />
              <span>New Topic</span>
            </motion.button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        {/* Active Topics Section */}
        <section>
          <div className="flex items-center gap-2 mb-5">
            <Target className="w-5 h-5 text-[hsl(var(--ki-orange))]" />
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
              Active Training
            </h2>
            <span className="ml-2 px-2 py-0.5 bg-[hsl(var(--ki-orange))]/10 text-[hsl(var(--ki-orange))] text-xs font-medium rounded-full">
              {mockTopics.active.length}/3
            </span>
          </div>

          {mockTopics.active.length === 0 ? (
            <EmptyState
              title="No active training"
              description="Start your journey by adding a new topic to master."
              action={() => setShowNewTopicModal(true)}
              actionLabel="Begin Training"
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {mockTopics.active.map((topic, index) => (
                  <ActiveTopicCard key={topic.id} topic={topic} index={index} />
                ))}
              </AnimatePresence>
            </div>
          )}
        </section>

        {/* Completed Topics */}
        {mockTopics.completed.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Mastered
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockTopics.completed.map((topic) => (
                <CompletedTopicCard key={topic.id} topic={topic} />
              ))}
            </div>
          </section>
        )}

        {/* Archived Topics */}
        {mockTopics.archived.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-5">
              <Archive className="w-5 h-5 text-[hsl(var(--muted-foreground))]" />
              <h2 className="text-lg font-semibold text-[hsl(var(--foreground))]">
                Archived
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {/* Archived topic cards */}
            </div>
          </section>
        )}
      </main>

      {/* New Topic Modal */}
      <AnimatePresence>
        {showNewTopicModal && (
          <NewTopicModal onClose={() => setShowNewTopicModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

interface ActiveTopicCardProps {
  topic: {
    id: string;
    name: string;
    mastery: number;
    subtopicsComplete: number;
    subtopicsTotal: number;
    lastActive: string;
    currentSubtopic: string;
  };
  index: number;
}

function ActiveTopicCard({ topic, index }: ActiveTopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.1 }}
      className="group relative bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-5 hover:border-[hsl(var(--ki-orange))]/30 hover:shadow-lg transition-all duration-300"
    >
      {/* Ki glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(var(--ki-orange))]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="relative">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[hsl(var(--ki-orange))]/10 rounded-lg">
              <BookOpen className="w-5 h-5 text-[hsl(var(--ki-orange))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[hsl(var(--foreground))]">
                {topic.name}
              </h3>
              <p className="text-xs text-[hsl(var(--muted-foreground))]">
                {topic.currentSubtopic}
              </p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              Mastery
            </span>
            <span className="text-sm font-medium text-[hsl(var(--foreground))]">
              {topic.mastery}%
            </span>
          </div>
          <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[hsl(var(--ki-orange))] to-[hsl(var(--ki-amber))]"
              initial={{ width: 0 }}
              animate={{ width: `${topic.mastery}%` }}
              transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))] mb-4">
          <span className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5" />
            {topic.subtopicsComplete}/{topic.subtopicsTotal} subtopics
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {topic.lastActive}
          </span>
        </div>

        {/* Action */}
        <motion.a
          href={`/chat?topic=${topic.id}`}
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[hsl(var(--ki-orange))] text-white font-medium rounded-xl hover:bg-[hsl(var(--ki-orange))]/90 transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Play className="w-4 h-4" />
          Continue Training
        </motion.a>
      </div>
    </motion.div>
  );
}

interface CompletedTopicCardProps {
  topic: {
    id: string;
    name: string;
    mastery: number;
    completedDate: string;
  };
}

function CompletedTopicCard({ topic }: CompletedTopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="font-semibold text-[hsl(var(--foreground))]">
            {topic.name}
          </h3>
        </div>
        <span className="text-lg font-bold text-green-500">{topic.mastery}%</span>
      </div>

      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Mastered {topic.completedDate}
      </p>
    </motion.div>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

function EmptyState({ title, description, action, actionLabel }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12 px-6 bg-[hsl(var(--card))] border border-dashed border-[hsl(var(--border))] rounded-2xl"
    >
      <SensieAvatar size="lg" className="mx-auto mb-4" />
      <h3 className="sensie-voice text-lg font-medium text-[hsl(var(--foreground))] mb-2">
        {title}
      </h3>
      <p className="text-[hsl(var(--muted-foreground))] mb-6 max-w-sm mx-auto">
        {description}
      </p>
      {action && actionLabel && (
        <motion.button
          onClick={action}
          className="px-6 py-2.5 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white font-medium rounded-xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {actionLabel}
        </motion.button>
      )}
    </motion.div>
  );
}

function NewTopicModal({ onClose }: { onClose: () => void }) {
  const [topicName, setTopicName] = useState('');
  const [goal, setGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // API call would go here
    setTimeout(() => {
      setIsLoading(false);
      onClose();
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-[hsl(var(--card))] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[hsl(var(--border))] bg-gradient-to-r from-[hsl(var(--ki-orange))]/10 to-transparent">
          <h2 className="text-xl font-semibold text-[hsl(var(--foreground))]">
            Begin New Training
          </h2>
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            What would you like to master?
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Topic
            </label>
            <input
              type="text"
              value={topicName}
              onChange={(e) => setTopicName(e.target.value)}
              placeholder="e.g., Rust Programming, System Design, Machine Learning"
              className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ki-orange))]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
              Goal <span className="text-[hsl(var(--muted-foreground))]">(optional)</span>
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Build a CLI tool, Pass the interview, Understand fundamentals"
              rows={3}
              className="w-full px-4 py-3 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ki-orange))] resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] font-medium hover:bg-[hsl(var(--muted))] transition-colors"
            >
              Cancel
            </button>
            <motion.button
              type="submit"
              disabled={!topicName.trim() || isLoading}
              className="flex-1 px-4 py-2.5 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
              whileHover={{ scale: isLoading ? 1 : 1.02 }}
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Start Training'
              )}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
