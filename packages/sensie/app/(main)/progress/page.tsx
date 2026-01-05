'use client';

/**
 * Progress Page
 *
 * Shows:
 * - Overall stats (XP, level, streak)
 * - Topic mastery breakdown
 * - Recent activity
 */

export default function ProgressPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Your Progress</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground">Total XP</p>
            <p className="text-3xl font-bold">0</p>
          </div>
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground">Level</p>
            <p className="text-3xl font-bold">1</p>
          </div>
          <div className="p-6 border rounded-lg">
            <p className="text-sm text-muted-foreground">Streak</p>
            <p className="text-3xl font-bold">0 days</p>
          </div>
        </div>

        {/* Mastery by Topic */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Topic Mastery</h2>
          <div className="p-6 border rounded-lg bg-muted/50 text-center">
            <p className="text-muted-foreground">
              Start learning to see your progress here!
            </p>
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="p-6 border rounded-lg bg-muted/50 text-center">
            <p className="text-muted-foreground">
              No recent activity.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
