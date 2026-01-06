'use client';

import Link from 'next/link';
import { Check, Lock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Progress Page - Detailed progress view
 */

// Mock data
const mockTopic = {
  name: 'Rust Programming',
  mastery: 75,
  level: 'Proficient',
  subtopics: [
    {
      name: 'Ownership Basics',
      mastery: 100,
      questionsAnswered: 5,
      hintsUsed: 0,
      status: 'completed' as const,
    },
    {
      name: 'Borrowing',
      mastery: 60,
      questionsAnswered: 3,
      hintsUsed: 2,
      status: 'in_progress' as const,
    },
    {
      name: 'Lifetimes',
      mastery: 0,
      questionsAnswered: 0,
      hintsUsed: 0,
      status: 'locked' as const,
    },
  ],
  stats: {
    totalQuestions: 45,
    accuracy: 84,
    hintsUsed: 7,
    reviewsCompleted: 3,
    nextReview: 'Tomorrow',
    successRate: 100,
  },
};

export default function ProgressPage() {
  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-lg font-medium text-[hsl(var(--foreground))]">
            {mockTopic.name}
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-8">
        {/* Overall progress */}
        <section>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-3xl font-mono font-medium text-[hsl(var(--foreground))]">
              {mockTopic.mastery}%
            </span>
            <span className="text-sm text-[hsl(var(--muted-foreground))]">
              {mockTopic.level}
            </span>
          </div>
          <div className="h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
            <div
              className="h-full bg-[hsl(var(--foreground))] transition-all duration-500"
              style={{ width: `${mockTopic.mastery}%` }}
            />
          </div>
        </section>

        {/* Subtopics */}
        <section>
          <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">
            Subtopics
          </h2>
          <div className="space-y-1">
            {mockTopic.subtopics.map((subtopic, index) => (
              <SubtopicRow
                key={subtopic.name}
                subtopic={subtopic}
                isLast={index === mockTopic.subtopics.length - 1}
              />
            ))}
          </div>
        </section>

        {/* Statistics */}
        <section>
          <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">
            Statistics
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              value={mockTopic.stats.totalQuestions.toString()}
              label="Questions"
            />
            <StatCard
              value={`${mockTopic.stats.accuracy}%`}
              label="Accuracy"
            />
            <StatCard
              value={mockTopic.stats.hintsUsed.toString()}
              label="Hints used"
            />
          </div>
        </section>

        {/* Review schedule */}
        <section>
          <h2 className="text-sm font-medium text-[hsl(var(--muted-foreground))] uppercase tracking-wide mb-4">
            Review Schedule
          </h2>
          <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Next review
                </span>
                <span className="text-[hsl(var(--foreground))]">
                  {mockTopic.stats.nextReview}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Reviews completed
                </span>
                <span className="text-[hsl(var(--foreground))]">
                  {mockTopic.stats.reviewsCompleted}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[hsl(var(--muted-foreground))]">
                  Success rate
                </span>
                <span className="text-[hsl(var(--foreground))]">
                  {mockTopic.stats.successRate}%
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Actions */}
        <div className="flex gap-3">
          <Link
            href="/chat"
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium rounded-lg hover:opacity-90 transition-opacity"
          >
            Continue learning
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/review"
            className="px-4 py-3 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
          >
            Start review
          </Link>
        </div>
      </main>
    </div>
  );
}

interface SubtopicRowProps {
  subtopic: {
    name: string;
    mastery: number;
    questionsAnswered: number;
    hintsUsed: number;
    status: 'completed' | 'in_progress' | 'locked';
  };
  isLast: boolean;
}

function SubtopicRow({ subtopic, isLast }: SubtopicRowProps) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[hsl(var(--border))] last:border-0">
      {/* Status indicator */}
      <div className="flex-shrink-0">
        {subtopic.status === 'completed' && (
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--success))] flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
        )}
        {subtopic.status === 'in_progress' && (
          <div className="w-5 h-5 rounded-full border-2 border-[hsl(var(--foreground))]" />
        )}
        {subtopic.status === 'locked' && (
          <div className="w-5 h-5 rounded-full bg-[hsl(var(--muted))] flex items-center justify-center">
            <Lock className="w-3 h-3 text-[hsl(var(--muted-foreground))]" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-4">
          <span
            className={cn(
              'text-sm',
              subtopic.status === 'locked'
                ? 'text-[hsl(var(--muted-foreground))]'
                : 'text-[hsl(var(--foreground))]'
            )}
          >
            {subtopic.name}
          </span>
          <div className="flex items-center gap-3">
            <div className="w-16 h-1 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--foreground))]"
                style={{ width: `${subtopic.mastery}%` }}
              />
            </div>
            <span className="text-xs font-mono text-[hsl(var(--muted-foreground))] w-8 text-right">
              {subtopic.mastery}%
            </span>
          </div>
        </div>
        {subtopic.status !== 'locked' && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            {subtopic.questionsAnswered} questions · {subtopic.hintsUsed} hints
          </p>
        )}
        {subtopic.status === 'locked' && (
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            Complete previous subtopic to unlock
          </p>
        )}
      </div>
    </div>
  );
}

interface StatCardProps {
  value: string;
  label: string;
}

function StatCard({ value, label }: StatCardProps) {
  return (
    <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-4">
      <p className="text-2xl font-mono font-medium text-[hsl(var(--foreground))]">
        {value}
      </p>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
        {label}
      </p>
    </div>
  );
}
