'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Clock, CheckCircle2, XCircle, ChevronRight, Sparkles } from 'lucide-react';
import { SensieAvatar } from '@/components/chat/sensie-avatar';

/**
 * Review Page - Spaced repetition review session
 *
 * Features:
 * - FSRS-based review cards
 * - Rating buttons (Again, Hard, Good, Easy)
 * - Progress through review queue
 * - Session summary
 */

// Mock data
const mockReviewQueue = [
  {
    id: '1',
    type: 'concept',
    question: 'What happens when you transfer ownership of a value in Rust?',
    topic: 'Rust Programming',
    subtopic: 'Ownership',
    lastReviewed: '3 days ago',
    difficulty: 3,
  },
  {
    id: '2',
    type: 'concept',
    question: 'Explain the difference between &T and &mut T in Rust.',
    topic: 'Rust Programming',
    subtopic: 'Borrowing',
    lastReviewed: '5 days ago',
    difficulty: 4,
  },
];

type ReviewState = 'idle' | 'reviewing' | 'complete';

export default function ReviewPage() {
  const [state, setState] = useState<ReviewState>('idle');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<Array<{ id: string; rating: number }>>([]);

  const dueCount = mockReviewQueue.length;
  const currentCard = mockReviewQueue[currentIndex];

  const startReview = () => {
    setState('reviewing');
    setCurrentIndex(0);
    setShowAnswer(false);
    setResults([]);
  };

  const rateCard = (rating: number) => {
    setResults([...results, { id: currentCard.id, rating }]);

    if (currentIndex < mockReviewQueue.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setShowAnswer(false);
    } else {
      setState('complete');
    }
  };

  const getNextInterval = (rating: number) => {
    switch (rating) {
      case 1: return '< 1m';
      case 2: return '~10m';
      case 3: return '~1d';
      case 4: return '~4d';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] paper-texture">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <SensieAvatar size="sm" />
            <div>
              <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Spaced Repetition
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Strengthen your memory
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {/* Idle State - Show due reviews */}
          {state === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl text-center">
                  <Clock className="w-8 h-8 text-[hsl(var(--ki-orange))] mx-auto mb-2" />
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">{dueCount}</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Due today</p>
                </div>
                <div className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl text-center">
                  <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-3xl font-bold text-[hsl(var(--foreground))]">0</p>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">Completed</p>
                </div>
              </div>

              {/* Start button or empty state */}
              {dueCount > 0 ? (
                <motion.div
                  className="p-8 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl text-center"
                >
                  <RotateCcw className="w-12 h-12 text-[hsl(var(--ki-orange))] mx-auto mb-4" />
                  <h2 className="sensie-voice text-xl font-medium text-[hsl(var(--foreground))] mb-2">
                    Ready to Review?
                  </h2>
                  <p className="text-[hsl(var(--muted-foreground))] mb-6">
                    You have {dueCount} concepts waiting to be reinforced.
                    Regular review is the path to mastery!
                  </p>
                  <motion.button
                    onClick={startReview}
                    className="px-8 py-3 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white font-medium rounded-xl shadow-lg"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Begin Review Session
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  className="p-8 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl text-center"
                >
                  <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h2 className="sensie-voice text-xl font-medium text-[hsl(var(--foreground))] mb-2">
                    All Caught Up!
                  </h2>
                  <p className="text-[hsl(var(--muted-foreground))] mb-6">
                    No reviews due right now. Come back later or continue learning new concepts.
                  </p>
                  <a
                    href="/chat"
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors"
                  >
                    Continue Learning
                    <ChevronRight className="w-4 h-4" />
                  </a>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Reviewing State - Show cards */}
          {state === 'reviewing' && currentCard && (
            <motion.div
              key="reviewing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Progress */}
              <div className="flex items-center gap-4">
                <div className="flex-1 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-[hsl(var(--ki-orange))] to-[hsl(var(--ki-amber))]"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / mockReviewQueue.length) * 100}%` }}
                  />
                </div>
                <span className="text-sm text-[hsl(var(--muted-foreground))]">
                  {currentIndex + 1} / {mockReviewQueue.length}
                </span>
              </div>

              {/* Card */}
              <motion.div
                key={currentCard.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl overflow-hidden"
              >
                {/* Card header */}
                <div className="px-6 py-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--muted))]/50">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[hsl(var(--muted-foreground))]">
                      {currentCard.topic} → {currentCard.subtopic}
                    </span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      Last reviewed: {currentCard.lastReviewed}
                    </span>
                  </div>
                </div>

                {/* Question */}
                <div className="p-8">
                  <p className="sensie-voice text-xl text-[hsl(var(--foreground))] text-center leading-relaxed">
                    {currentCard.question}
                  </p>
                </div>

                {/* Show answer button or rating buttons */}
                <div className="px-6 pb-6">
                  {!showAnswer ? (
                    <motion.button
                      onClick={() => setShowAnswer(true)}
                      className="w-full py-3 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      Think about it, then show answer
                    </motion.button>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
                        How well did you recall this?
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { rating: 1, label: 'Again', color: 'bg-red-500 hover:bg-red-600', textColor: 'text-red-500' },
                          { rating: 2, label: 'Hard', color: 'bg-orange-500 hover:bg-orange-600', textColor: 'text-orange-500' },
                          { rating: 3, label: 'Good', color: 'bg-green-500 hover:bg-green-600', textColor: 'text-green-500' },
                          { rating: 4, label: 'Easy', color: 'bg-blue-500 hover:bg-blue-600', textColor: 'text-blue-500' },
                        ].map(({ rating, label, color, textColor }) => (
                          <motion.button
                            key={rating}
                            onClick={() => rateCard(rating)}
                            className={`py-4 ${color} text-white font-medium rounded-xl transition-colors`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span className="block text-sm font-bold">{label}</span>
                            <span className="block text-xs opacity-80">{getNextInterval(rating)}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* Complete State - Show summary */}
          {state === 'complete' && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.2 }}
              >
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              </motion.div>

              <h2 className="sensie-voice text-2xl font-medium text-[hsl(var(--foreground))] mb-2">
                Review Complete!
              </h2>
              <p className="text-[hsl(var(--muted-foreground))] mb-8">
                You reviewed {results.length} concepts. Great work!
              </p>

              {/* Results breakdown */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {['Again', 'Hard', 'Good', 'Easy'].map((label, i) => {
                  const count = results.filter((r) => r.rating === i + 1).length;
                  return (
                    <div key={label} className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl">
                      <p className="text-2xl font-bold text-[hsl(var(--foreground))]">{count}</p>
                      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-4 justify-center">
                <motion.button
                  onClick={startReview}
                  className="px-6 py-2.5 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Review Again
                </motion.button>
                <motion.a
                  href="/chat"
                  className="px-6 py-2.5 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white font-medium rounded-xl"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Continue Learning
                </motion.a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
