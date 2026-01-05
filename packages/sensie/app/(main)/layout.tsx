/**
 * Main App Layout
 *
 * Layout for authenticated pages with:
 * - Sidebar navigation
 * - Header with user info
 * - Main content area
 */

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-card hidden md:block">
        <div className="p-4">
          <h1 className="text-xl font-bold">Sensie</h1>
        </div>
        <nav className="p-4 space-y-2">
          <a href="/chat" className="block px-4 py-2 rounded-lg hover:bg-accent">
            Chat
          </a>
          <a href="/topics" className="block px-4 py-2 rounded-lg hover:bg-accent">
            Topics
          </a>
          <a href="/progress" className="block px-4 py-2 rounded-lg hover:bg-accent">
            Progress
          </a>
          <a href="/review" className="block px-4 py-2 rounded-lg hover:bg-accent">
            Review
          </a>
          <a href="/settings" className="block px-4 py-2 rounded-lg hover:bg-accent">
            Settings
          </a>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
