'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { DocumentCard } from '@/components/ui';
import { LatencyBadge } from '@/components/ui';
import { buildFolderTree, type FolderNode } from '@/lib/utils';

interface Document {
  path: string;
  title: string;
  tags: string[];
  type?: string;
  source?: string;
  updatedAt: string;
}

interface IndexResponse {
  documents: Document[];
  folders: string[];
  tagCounts: Record<string, number>;
  total: number;
  latencyMs: number;
}

export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [folders, setFolders] = useState<FolderNode[]>([]);
  const [tags, setTags] = useState<{ name: string; count: number }[]>([]);
  const [total, setTotal] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (selectedFolder) params.set('folder', selectedFolder);
      if (selectedTag) params.set('tags', selectedTag);
      params.set('limit', '50');

      const response = await fetch(`/api/index?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data: IndexResponse = await response.json();

      setDocuments(data.documents);
      setFolders(buildFolderTree(data.folders));
      setTags(
        Object.entries(data.tagCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
      );
      setTotal(data.total);
      setLatencyMs(data.latencyMs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedFolder, selectedTag]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    // TODO: Implement search navigation
    if (query.length > 2) {
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    }
  }, []);

  const handleFolderSelect = useCallback((path: string) => {
    setSelectedFolder(path);
    setSelectedTag(''); // Clear tag filter when folder changes
  }, []);

  const handleTagSelect = useCallback((tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  }, [selectedTag]);

  return (
    <AppLayout
      folders={folders}
      tags={tags}
      selectedFolder={selectedFolder}
      selectedTag={selectedTag}
      onSearch={handleSearch}
      onFolderSelect={handleFolderSelect}
      onTagSelect={handleTagSelect}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-headline italic text-accent-blue-light">
              {selectedFolder
                ? `Documents in ${selectedFolder}`
                : selectedTag
                  ? `Tagged: ${selectedTag}`
                  : 'All Documents'}
            </h1>
            <p className="text-sm text-text-subtle mt-1">
              {total} document{total !== 1 ? 's' : ''}
              {latencyMs !== null && (
                <span className="ml-2">
                  <LatencyBadge latencyMs={latencyMs} />
                </span>
              )}
            </p>
          </div>

          {/* Filters indicator */}
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

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="card animate-pulse"
                style={{ height: '140px' }}
              >
                <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-3" />
                <div className="h-3 bg-bg-tertiary rounded w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-5 bg-bg-tertiary rounded w-16" />
                  <div className="h-5 bg-bg-tertiary rounded w-12" />
                </div>
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
              <p className="font-medium text-error">Error loading documents</p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-text-primary mb-2">
              No documents found
            </h3>
            <p className="text-text-muted mb-4">
              {selectedFolder || selectedTag
                ? 'Try adjusting your filters or create a new document.'
                : 'Get started by creating your first document.'}
            </p>
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
              New Document
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.path}
                path={doc.path}
                title={doc.title}
                tags={doc.tags}
                type={doc.type}
                source={doc.source}
                updatedAt={new Date(doc.updatedAt)}
              />
            ))}
          </div>
        )}

        {/* Load more */}
        {documents.length > 0 && documents.length < total && (
          <div className="text-center mt-8">
            <button className="btn-secondary">Load more</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
