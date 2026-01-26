import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge class names with Tailwind CSS support (from shadcn/ui)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date as a relative time string (e.g., "2 hours ago")
 */
export function formatDistanceToNow(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSeconds < 60) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  } else if (diffDays === 1) {
    return 'yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  } else if (diffWeeks < 4) {
    return `${diffWeeks} week${diffWeeks === 1 ? '' : 's'} ago`;
  } else if (diffMonths < 12) {
    return `${diffMonths} month${diffMonths === 1 ? '' : 's'} ago`;
  } else {
    return `${diffYears} year${diffYears === 1 ? '' : 's'} ago`;
  }
}

/**
 * Format a date in a readable format
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date with time
 */
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Truncate text to a maximum length
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Extract title from markdown content (first # heading)
 */
export function extractTitleFromMarkdown(content: string): string | null {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : null;
}

/**
 * Derive folder path from document path
 */
export function getFolderPath(documentPath: string): string {
  const parts = documentPath.split('/');
  return parts.slice(0, -1).join('/') || '/';
}

/**
 * Get document name from path
 */
export function getDocumentName(documentPath: string): string {
  const parts = documentPath.split('/');
  return parts[parts.length - 1] || documentPath;
}

/**
 * Build folder tree from flat list of paths
 */
export interface FolderNode {
  name: string;
  path: string;
  children: FolderNode[];
  documentCount: number;
}

export function buildFolderTree(
  paths: string[],
  documentCounts?: Record<string, number>
): FolderNode[] {
  const root: Record<string, FolderNode> = {};

  for (const path of paths) {
    const parts = path.split('/').filter(Boolean);
    let current = root;
    let currentPath = '';

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      currentPath += '/' + part;

      if (!current[part]) {
        current[part] = {
          name: part,
          path: currentPath,
          children: [],
          documentCount: documentCounts?.[currentPath] || 0,
        };
      }

      // Move to children map
      const childMap: Record<string, FolderNode> = {};
      for (const child of current[part].children) {
        childMap[child.name] = child;
      }
      current = childMap;
    }
  }

  // Convert to array structure
  function mapToArray(map: Record<string, FolderNode>): FolderNode[] {
    return Object.values(map)
      .map((node) => ({
        ...node,
        children: mapToArray(
          Object.fromEntries(node.children.map((c) => [c.name, c]))
        ),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  return mapToArray(root);
}

/**
 * Classify latency for styling
 */
export function classifyLatency(ms: number): 'fast' | 'medium' | 'slow' {
  if (ms < 1) return 'fast';
  if (ms <= 5) return 'medium';
  return 'slow';
}

/**
 * Debounce a function
 */
export function debounce<Args extends unknown[]>(
  func: (...args: Args) => void,
  wait: number
): (...args: Args) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Args) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      func(...args);
    }, wait);
  };
}

/**
 * Validate document path
 */
export function isValidPath(path: string): boolean {
  // Must start with /
  if (!path.startsWith('/')) return false;
  // No double slashes
  if (path.includes('//')) return false;
  // No trailing slash (except root)
  if (path !== '/' && path.endsWith('/')) return false;
  // Only alphanumeric, dashes, underscores, and slashes
  if (!/^[\w\-\/]+$/.test(path)) return false;
  return true;
}
