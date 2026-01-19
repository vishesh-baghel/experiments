'use client';

import Link from 'next/link';
import { formatDistanceToNow } from '@/lib/utils';

interface DocumentCardProps {
  path: string;
  title: string;
  tags: string[];
  type?: string;
  source?: string;
  updatedAt: Date;
  snippet?: string;
  latencyMs?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

export function DocumentCard({
  path,
  title,
  tags,
  type,
  source,
  updatedAt,
  snippet,
  latencyMs,
  isSelected = false,
  onClick,
}: DocumentCardProps) {
  const content = (
    <div
      className={`
        card card-interactive p-4
        ${isSelected ? 'border-accent-blue' : ''}
      `}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-2">
        <svg
          className="w-5 h-5 text-accent-cyan flex-shrink-0 mt-0.5"
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
        <div className="flex-1 min-w-0">
          <h3 className="text-text-primary font-medium truncate">
            {title || path.split('/').pop()}
          </h3>
          <p className="text-xs text-text-subtle truncate">{path}</p>
        </div>
      </div>

      {/* Snippet (if search result) */}
      {snippet && (
        <p
          className="text-sm text-text-muted mb-3 line-clamp-2"
          dangerouslySetInnerHTML={{ __html: snippet }}
        />
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.slice(0, 4).map((tag) => (
            <span key={tag} className="tag text-xs">
              {tag}
            </span>
          ))}
          {tags.length > 4 && (
            <span className="tag text-xs text-text-subtle">
              +{tags.length - 4}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-text-subtle">
        <span>Updated {formatDistanceToNow(updatedAt)}</span>
        <div className="flex items-center gap-2">
          {type && (
            <span className="px-1.5 py-0.5 bg-bg-tertiary rounded">
              {type}
            </span>
          )}
          {latencyMs !== undefined && (
            <span
              className={`
                ${latencyMs < 1 ? 'text-success' : latencyMs <= 5 ? 'text-warning' : 'text-error'}
              `}
            >
              {latencyMs.toFixed(2)}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );

  // Wrap in Link if no custom onClick handler
  if (!onClick) {
    return (
      <Link href={`/documents${path}`} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
