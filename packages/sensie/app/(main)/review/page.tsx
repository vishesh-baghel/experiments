'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Review Page - Spaced repetition session
 */

// Mock data
const mockReviewQueue = [
  {
    id: '1',
    question: 'What happens when you transfer ownership of a value in Rust?',
    topic: 'Rust Programming',
    subtopic: 'Ownership',
    lastReviewed: '7 days ago',
  },
  {
    id: '2',
    question: 'Explain the difference between &T and &mut T.',
    topic: 'Rust Programming',
    subtopic: 'Borrowing',
    lastReviewed: '5 days ago',
  },
];

type ReviewState = 'idle' | 'reviewing' | 'complete';
type Rating = 'again' | 'hard' | 'good' | 'easy';

const RATINGS: { id: Rating; label: string; interval: string }[] = [
  { id: 'again', label: 'Again', interval: '<1min' },
  { id: 'hard', label: 'Hard', interval: '~10min' },
  { id: 'good', label: 'Good', interval: '~1day' },
  { id: 'easy', label: 'Easy', interval: '~4days' },
];

export default function ReviewPage() {
  const [state, setState] = useState<ReviewState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; rating: Rating }>>([]);

  const dueCount = mockReviewQueue.length;
  const currentCard = mockReviewQueue[currentIndex];

  const startReview = () => {
    setState('reviewing');
    setCurrentIndex(0);
    setShowAnswer(false);
    setResults([]);
  };

  const rateCard = (rating: Rating) => {
    setResults([...results, { id: currentCard.id, rating }]);

    if (currentIndex < mockReviewQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setState('complete');
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <h1 className="text-lg font-medium text-[hsl(var(--foreground))]">
            Review
          </h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Idle State */}
        {state === 'idle' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-6 text-center">
                <p className="text-3xl font-mono font-medium text-[hsl(var(--foreground))]">
                  {dueCount}
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Due today
                </p>
              </div>
              <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-6 text-center">
                <p className="text-3xl font-mono font-medium text-[hsl(var(--foreground))]">
                  0
                </p>
                <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
                  Completed
                </p>
              </div>
            </div>

            {dueCount > 0 ? (
              <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-6 text-center">
                <p className="text-[hsl(var(--foreground))] mb-4">
                  You have {dueCount} items ready for review.
                </p>
                <button
                  onClick={startReview}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  Start review
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-6 text-center">
                <p className="text-[hsl(var(--muted-foreground))] mb-4">
                  No reviews due. Come back later.
                </p>
                <Link
                  href="/chat"
                  className="inline-flex items-center gap-2 text-sm text-[hsl(var(--foreground))] hover:underline"
                >
                  Continue learning
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Reviewing State */}
        {state === 'reviewing' && currentCard && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center gap-4">
              <div className="flex-1 h-1 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[hsl(var(--foreground))] transition-all"
                  style={{
                    width: `${((currentIndex + 1) / mockReviewQueue.length) * 100}%`,
                  }}
                />
              </div>
              <span className="text-sm font-mono text-[hsl(var(--muted-foreground))]">
                {currentIndex + 1}/{mockReviewQueue.length}
              </span>
            </div>

            {/* Card */}
            <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] overflow-hidden">
              <div className="px-4 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))/0.3]">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[hsl(var(--muted-foreground))]">
                    {currentCard.topic} / {currentCard.subtopic}
                  </span>
                  <span className="text-[hsl(var(--muted-foreground))]">
                    Last: {currentCard.lastReviewed}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <p className="text-lg text-[hsl(var(--foreground))] text-center leading-relaxed">
                  {currentCard.question}
                </p>
              </div>

              <div className="px-6 pb-6">
                {!showAnswer ? (
                  <button
                    onClick={() => setShowAnswer(true)}
                    className="w-full py-3 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
                  >
                    Show answer
                  </button>
                ) : (
                  <div className="space-y-4">
                    <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                      How well did you recall this?
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {RATINGS.map(({ id, label, interval }) => (
                        <button
                          key={id}
                          onClick={() => rateCard(id)}
                          className={cn(
                            'py-3 rounded-lg font-medium text-sm transition-colors',
                            'border border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'
                          )}
                        >
                          <span className="block text-[hsl(var(--foreground))]">
                            {label}
                          </span>
                          <span className="block text-xs text-[hsl(var(--muted-foreground))] mt-0.5">
                            {interval}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Complete State */}
        {state === 'complete' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 rounded-full bg-[hsl(var(--success))] flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-medium text-[hsl(var(--foreground))] mb-2">
              Review complete
            </h2>
            <p className="text-[hsl(var(--muted-foreground))] mb-8">
              You reviewed {results.length} items.
            </p>

            {/* Results breakdown */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              {RATINGS.map(({ id, label }) => {
                const count = results.filter((r) => r.rating === id).length;
                return (
                  <div
                    key={id}
                    className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] p-4"
                  >
                    <p className="text-2xl font-mono font-medium text-[hsl(var(--foreground))]">
                      {count}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={startReview}
                className="px-6 py-2.5 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium rounded-lg hover:bg-[hsl(var(--muted))] transition-colors"
              >
                Review again
              </button>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium rounded-lg hover:opacity-90 transition-opacity"
              >
                Continue learning
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
