'use client';

/**
 * Topics Page
 *
 * Shows:
 * - Active topics (max 3)
 * - Completed topics
 * - Add new topic
 */

export default function TopicsPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Your Topics</h1>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg">
            + New Topic
          </button>
        </div>

        {/* Active Topics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Active (0/3)</h2>
          <div className="grid gap-4">
            <div className="p-6 border rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">
                No active topics. Start learning something new!
              </p>
            </div>
          </div>
        </section>

        {/* Completed Topics */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Completed</h2>
          <div className="grid gap-4">
            <div className="p-6 border rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">
                Complete your first topic to see it here!
              </p>
            </div>
          </div>
        </section>

        {/* Archived Topics */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Archived</h2>
          <div className="grid gap-4">
            <div className="p-6 border rounded-lg bg-muted/50 text-center">
              <p className="text-muted-foreground">
                No archived topics.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
