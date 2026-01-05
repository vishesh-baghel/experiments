'use client';

/**
 * Chat Page
 *
 * Main learning interface with:
 * - Message list
 * - Input area
 * - Current topic/concept context
 */

export default function ChatPage() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="p-4 border-b">
        <h1 className="font-semibold">Learning Session</h1>
        <p className="text-sm text-muted-foreground">
          Current topic: None selected
        </p>
      </header>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Welcome message */}
        <div className="bg-muted p-4 rounded-lg max-w-2xl">
          <p className="font-semibold">Sensie</p>
          <p>
            Hohoho! Welcome, young student! I am Sensie, your guide on this
            journey of learning. What topic shall we master today?
          </p>
        </div>
      </div>

      {/* Input area */}
      <div className="p-4 border-t">
        <form className="flex gap-2">
          <input
            type="text"
            placeholder="Type your message or /command..."
            className="flex-1 px-4 py-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg"
          >
            Send
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-2">
          Commands: /hint, /skip, /progress, /topics, /break, /review
        </p>
      </div>
    </div>
  );
}
