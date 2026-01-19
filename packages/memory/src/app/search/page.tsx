'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';
import { DocumentCard, LatencyBadge } from '@/components/ui';
import { buildFolderTree, type FolderNode, debounce } from '@/lib/utils';

interface SearchResult {
  path: string;
  title: string;
  snippet: string;
  tags: string[];
  type?: string;
  source?: string;
  updatedAt: string;
}

interface SearchResponse {
  documents: SearchResult[];
  total: number;
  latencyMs: number;
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');

  const search = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setTotal(0);
      setLatencyMs(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ q: searchQuery });
      if (selectedFolder) params.set('folder', selectedFolder);
      if (selectedTag) params.set('tags', selectedTag);
      params.set('limit', '20');

      const response = await fetch(`/api/search?${params}`);
      if (!response.ok) {
        throw new Error('Search failed');
      }

      const data: SearchResponse = await response.json();
      setResults(data.documents);
      setTotal(data.total);
      setLatencyMs(data.latencyMs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder, selectedTag]);

  // Fetch index for sidebar
  const fetchIndex = useCallback(async () => {
    try {
      const response = await fetch('/api/index?limit=1000');
      if (response.ok) {
        const data = await response.json();
        setFolders(buildFolderTree(data.folders));
        setTags(
          Object.entries(data.tagCounts as Record<string, number>)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count)
        );
      }
    } catch {
      // Ignore errors for sidebar data
    }
  }, []);

  useEffect(() => {
    fetchIndex();
  }, [fetchIndex]);

  useEffect(() => {
    search(query);
  }, [search, query]);

  // Debounced search for input
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // Update URL
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set('q', value);
      } else {
        url.searchParams.delete('q');
      }
      router.replace(url.pathname + url.search);

      search(value);
    }, 300),
    [router, search]
  );

  const handleInputChange = (value: string) => {
    setQuery(value);
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setQuery('');
    router.replace('/search');
    setResults([]);
    setTotal(0);
    setLatencyMs(null);
  };

  return (
    <AppLayout
      folders={folders}
      tags={tags}
      selectedFolder={selectedFolder}
      selectedTag={selectedTag}
      onSearch={handleInputChange}
      onFolderSelect={(path) => {
        setSelectedFolder(path);
        if (query) search(query);
      }}
      onTagSelect={(tag) => {
        setSelectedTag(tag === selectedTag ? '' : tag);
        if (query) search(query);
      }}
    >
      <div className="p-6">
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-2xl">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-subtle"
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
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              className="input pl-12 pr-10 py-3 text-lg"
              placeholder="Search documents..."
              autoFocus
            />
            {query && (
              <button
                onClick={handleClearSearch}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-text-subtle hover:text-text-primary"
                aria-label="Clear search"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        {query && (
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-text-muted">
              {isLoading ? (
                'Searching...'
              ) : (
                <>
                  Found <span className="text-text-primary">{total}</span> result
                  {total !== 1 ? 's' : ''} for &ldquo;
                  <span className="text-text-primary">{query}</span>&rdquo;
                  {latencyMs !== null && (
                    <span className="ml-2">
                      <LatencyBadge latencyMs={latencyMs} />
                    </span>
                  )}
                </>
              )}
            </div>

            {(selectedFolder || selectedTag) && (
              <button
                onClick={() => {
                  setSelectedFolder('');
                  setSelectedTag('');
                }}
                className="btn-ghost text-sm"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Results */}
        {!query ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-text-subtle mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              Search your knowledge base
            </h2>
            <p className="text-text-muted">
              Enter a search term to find documents
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ height: '120px' }}>
                <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-3" />
                <div className="h-3 bg-bg-tertiary rounded w-full mb-2" />
                <div className="h-3 bg-bg-tertiary rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="callout callout-error">
            <svg
              className="w-5 h-5 text-error flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="font-medium text-error">Search failed</p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-text-subtle mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              No results found
            </h2>
            <p className="text-text-muted">
              Try different keywords or adjust your filters
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {results.map((result) => (
              <DocumentCard
                key={result.path}
                path={result.path}
                title={result.title}
                tags={result.tags}
                type={result.type}
                source={result.source}
                updatedAt={new Date(result.updatedAt)}
                snippet={result.snippet}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {results.length > 0 && results.length < total && (
          <div className="text-center mt-8">
            <button className="btn-secondary">Load more</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-12 bg-bg-tertiary rounded w-full max-w-2xl mb-6" />
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="card" style={{ height: '120px' }}>
                  <div className="h-4 bg-bg-tertiary rounded w-1/2 mb-3" />
                  <div className="h-3 bg-bg-tertiary rounded w-full mb-2" />
                  <div className="h-3 bg-bg-tertiary rounded w-3/4" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <SearchPageContent />
    </Suspense>
  );
}
