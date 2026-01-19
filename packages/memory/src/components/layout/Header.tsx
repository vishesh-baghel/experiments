'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface HeaderProps {
  onSearch?: (query: string) => void;
  isDemo?: boolean;
}

export function Header({ onSearch, isDemo = false }: HeaderProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between h-14 px-6 bg-bg-primary border-b border-[rgba(255,255,255,0.08)]">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <svg
          className="w-6 h-6 text-accent-cyan"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span className="font-headline text-lg italic text-accent-blue-light">
          Memory
        </span>
        {isDemo && (
          <span className="px-2 py-0.5 text-xs font-medium bg-warning/10 text-warning rounded">
            Demo
          </span>
        )}
      </Link>

      {/* Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="search-input">
          <svg
            className="w-4 h-4 text-text-subtle"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search documents..."
            onChange={(e) => onSearch?.(e.target.value)}
            className="w-full"
          />
          <kbd className="hidden md:inline-flex px-1.5 py-0.5 text-xs font-mono text-text-subtle bg-bg-tertiary rounded">
            /
          </kbd>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {!isDemo && (
          <Link href="/documents/new" className="btn-primary">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="hidden sm:inline">New</span>
          </Link>
        )}

        {isDemo ? (
          <Link href="/login" className="btn-secondary">
            Sign In
          </Link>
        ) : (
          <Link
            href="/settings"
            className={`btn-ghost ${pathname === '/settings' ? 'bg-bg-tertiary' : ''}`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </Link>
        )}
      </div>
    </header>
  );
}
