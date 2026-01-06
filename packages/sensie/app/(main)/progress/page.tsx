'use client';

import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  Zap,
  Target,
  Calendar,
  TrendingUp,
  Award,
  Clock,
} from 'lucide-react';
import { SensieAvatar } from '@/components/chat/sensie-avatar';

/**
 * Progress Page - Training dashboard
 *
 * Features:
 * - XP and level display
 * - Streak tracking
 * - Topic mastery breakdown
 * - Recent activity timeline
 * - Achievement badges
 */

// Mock data
const mockProgress = {
  xp: 1250,
  level: 5,
  xpToNextLevel: 500,
  streak: 7,
  longestStreak: 14,
  totalQuestions: 156,
  correctAnswers: 128,
  hoursLearned: 12.5,
  topicsInProgress: 2,
  topicsMastered: 1,
};

const mockTopicMastery = [
  { name: 'Rust Programming', mastery: 45, color: 'from-orange-500 to-amber-500' },
  { name: 'System Design', mastery: 20, color: 'from-blue-500 to-cyan-500' },
  { name: 'TypeScript', mastery: 92, color: 'from-green-500 to-emerald-500' },
];

const mockRecentActivity = [
  { type: 'question', text: 'Answered question on Ownership', time: '2 hours ago', correct: true },
  { type: 'streak', text: 'Extended streak to 7 days!', time: '1 day ago' },
  { type: 'mastery', text: 'Reached 45% mastery in Rust', time: '1 day ago' },
  { type: 'question', text: 'Completed 5 review items', time: '2 days ago', correct: true },
];

export default function ProgressPage() {
  const accuracy = Math.round((mockProgress.correctAnswers / mockProgress.totalQuestions) * 100);
  const levelProgress = ((mockProgress.xp % 250) / 250) * 100;

  return (
    <div className="min-h-screen bg-[hsl(var(--background))] paper-texture">
      {/* Header */}
      <header className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <SensieAvatar size="sm" />
            <div>
              <h1 className="text-xl font-semibold text-[hsl(var(--foreground))]">
                Training Progress
              </h1>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Your journey so far
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero Stats */}
        <section className="grid gap-4 md:grid-cols-4">
          {/* Level & XP */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 p-6 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] rounded-2xl text-white"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/70 text-sm mb-1">Current Level</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{mockProgress.level}</span>
                  <span className="text-white/70">/ 100</span>
                </div>
              </div>
              <div className="p-3 bg-white/20 rounded-xl">
                <Zap className="w-8 h-8" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">{mockProgress.xp} XP</span>
                <span className="text-white/70">{mockProgress.xp + mockProgress.xpToNextLevel} XP</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-white"
                  initial={{ width: 0 }}
                  animate={{ width: `${levelProgress}%` }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                />
              </div>
              <p className="text-sm text-white/70">
                {mockProgress.xpToNextLevel} XP to level {mockProgress.level + 1}
              </p>
            </div>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Flame className="w-8 h-8 text-[hsl(var(--ki-orange))]" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                Best: {mockProgress.longestStreak}
              </span>
            </div>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {mockProgress.streak} days
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Current streak
            </p>
          </motion.div>

          {/* Accuracy */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl"
          >
            <div className="flex items-center justify-between mb-4">
              <Target className="w-8 h-8 text-green-500" />
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                {mockProgress.correctAnswers}/{mockProgress.totalQuestions}
              </span>
            </div>
            <p className="text-3xl font-bold text-[hsl(var(--foreground))]">
              {accuracy}%
            </p>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">
              Accuracy rate
            </p>
          </motion.div>
        </section>

        {/* Quick Stats */}
        <section className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <StatCard
            icon={Clock}
            value={`${mockProgress.hoursLearned}h`}
            label="Time learned"
            delay={0.3}
          />
          <StatCard
            icon={Trophy}
            value={mockProgress.topicsMastered.toString()}
            label="Topics mastered"
            delay={0.35}
          />
          <StatCard
            icon={TrendingUp}
            value={mockProgress.topicsInProgress.toString()}
            label="In progress"
            delay={0.4}
          />
          <StatCard
            icon={Award}
            value="3"
            label="Badges earned"
            delay={0.45}
          />
        </section>

        {/* Two-column layout */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Topic Mastery */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-5 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-[hsl(var(--ki-orange))]" />
              Topic Mastery
            </h2>
            <div className="space-y-5">
              {mockTopicMastery.map((topic, index) => (
                <div key={topic.name}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[hsl(var(--foreground))]">
                      {topic.name}
                    </span>
                    <span className="text-sm font-bold text-[hsl(var(--foreground))]">
                      {topic.mastery}%
                    </span>
                  </div>
                  <div className="h-3 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full bg-gradient-to-r ${topic.color}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${topic.mastery}%` }}
                      transition={{ duration: 0.8, delay: 0.6 + index * 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* Recent Activity */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="p-6 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl"
          >
            <h2 className="text-lg font-semibold text-[hsl(var(--foreground))] mb-5 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[hsl(var(--ki-orange))]" />
              Recent Activity
            </h2>
            <div className="space-y-4">
              {mockRecentActivity.map((activity, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <div className={`
                    p-1.5 rounded-lg mt-0.5
                    ${activity.type === 'question' && activity.correct ? 'bg-green-500/10' : ''}
                    ${activity.type === 'streak' ? 'bg-[hsl(var(--ki-orange))]/10' : ''}
                    ${activity.type === 'mastery' ? 'bg-blue-500/10' : ''}
                  `}>
                    {activity.type === 'question' && (
                      <Target className={`w-4 h-4 ${activity.correct ? 'text-green-500' : 'text-red-500'}`} />
                    )}
                    {activity.type === 'streak' && (
                      <Flame className="w-4 h-4 text-[hsl(var(--ki-orange))]" />
                    )}
                    {activity.type === 'mastery' && (
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[hsl(var(--foreground))]">
                      {activity.text}
                    </p>
                    <p className="text-xs text-[hsl(var(--muted-foreground))]">
                      {activity.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        </div>

        {/* Sensie's Words */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="p-6 bg-gradient-to-br from-[hsl(var(--ki-orange))]/5 to-transparent border border-[hsl(var(--ki-orange))]/20 rounded-2xl"
        >
          <div className="flex items-start gap-4">
            <SensieAvatar size="md" />
            <div>
              <p className="sensie-voice text-lg text-[hsl(var(--foreground))] leading-relaxed">
                "Hohoho! {mockProgress.streak} days of training without rest!
                Your dedication reminds me of my finest students.
                Keep this pace, and you'll master {mockTopicMastery[0].name} in no time!"
              </p>
              <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
                — Sensie's encouragement
              </p>
            </div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

interface StatCardProps {
  icon: React.ElementType;
  value: string;
  label: string;
  delay: number;
}

function StatCard({ icon: Icon, value, label, delay }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="p-4 bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-xl"
    >
      <Icon className="w-5 h-5 text-[hsl(var(--muted-foreground))] mb-2" />
      <p className="text-xl font-bold text-[hsl(var(--foreground))]">{value}</p>
      <p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p>
    </motion.div>
  );
}
