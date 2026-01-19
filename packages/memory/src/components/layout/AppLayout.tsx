'use client';

import { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  documentCount?: number;
}

interface AppLayoutProps {
  children: React.ReactNode;
  folders?: FolderNode[];
  tags?: { name: string; count: number }[];
  isDemo?: boolean;
  onSearch?: (query: string) => void;
  onFolderSelect?: (path: string) => void;
  onTagSelect?: (tag: string) => void;
  selectedFolder?: string;
  selectedTag?: string;
  hideSidebar?: boolean;
}

export function AppLayout({
  children,
  folders = [],
  tags = [],
  isDemo = false,
  onSearch,
  onFolderSelect,
  onTagSelect,
  selectedFolder,
  selectedTag,
  hideSidebar = false,
}: AppLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-bg-primary">
      <Header onSearch={onSearch} isDemo={isDemo} />

      <div className="flex">
        {/* Sidebar */}
        {!hideSidebar && (
          <>
            {/* Mobile overlay */}
            {isSidebarOpen && (
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsSidebarOpen(false)}
              />
            )}

            {/* Sidebar */}
            <div
              className={`
                fixed lg:static inset-y-14 left-0 z-40
                transform transition-transform duration-200 ease-in-out
                ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              `}
            >
              <Sidebar
                folders={folders}
                tags={tags}
                selectedFolder={selectedFolder}
                selectedTag={selectedTag}
                onFolderSelect={(path) => {
                  onFolderSelect?.(path);
                  // Close sidebar on mobile after selection
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
                onTagSelect={(tag) => {
                  onTagSelect?.(tag);
                  if (window.innerWidth < 1024) {
                    setIsSidebarOpen(false);
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Main content */}
        <main className="flex-1 min-h-[calc(100vh-56px)] overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile sidebar toggle */}
      {!hideSidebar && (
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="fixed bottom-4 left-4 z-50 lg:hidden btn-primary rounded-full p-3 shadow-lg"
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
