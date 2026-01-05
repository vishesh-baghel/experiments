'use client';

/**
 * Review Page
 *
 * Spaced repetition review session:
 * - Due reviews count
 * - Current review card
 * - Rating buttons (Again, Hard, Good, Easy)
 */

export default function ReviewPage() {
  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-8">Spaced Repetition Review</h1>

        {/* Review stats */}
        <div className="flex gap-4 mb-8">
          <div className="p-4 border rounded-lg flex-1 text-center">
            <p className="text-sm text-muted-foreground">Due Today</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div className="p-4 border rounded-lg flex-1 text-center">
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-bold">0</p>
          </div>
        </div>

        {/* No reviews due */}
        <div className="p-8 border rounded-lg text-center">
          <p className="text-lg mb-4">No reviews due!</p>
          <p className="text-muted-foreground mb-6">
            Great job staying on top of your reviews. Check back later or
            continue learning new concepts.
          </p>
          <a
            href="/chat"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg inline-block"
          >
            Continue Learning
          </a>
        </div>

        {/* Rating buttons (shown when reviewing) */}
        <div className="hidden mt-8 grid grid-cols-4 gap-2">
          <button className="p-4 border rounded-lg hover:bg-destructive/10 text-destructive">
            <span className="block font-semibold">Again</span>
            <span className="text-xs">&lt; 1m</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-orange-500/10 text-orange-500">
            <span className="block font-semibold">Hard</span>
            <span className="text-xs">~10m</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-green-500/10 text-green-500">
            <span className="block font-semibold">Good</span>
            <span className="text-xs">~1d</span>
          </button>
          <button className="p-4 border rounded-lg hover:bg-blue-500/10 text-blue-500">
            <span className="block font-semibold">Easy</span>
            <span className="text-xs">~4d</span>
          </button>
        </div>
      </div>
    </div>
  );
}
