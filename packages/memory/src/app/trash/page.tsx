'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { formatDistanceToNow } from '@/lib/utils';

interface DeletedDocument {
  path: string;
  title: string;
  tags: string[];
  deletedAt: string;
}

export default function TrashPage() {
  const [documents, setDocuments] = useState<DeletedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [restoringPath, setRestoringPath] = useState<string | null>(null);

  const fetchTrash = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In production, this would fetch deleted documents from the API
      // For now, show empty state
      setDocuments([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load trash');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (path: string) => {
    setRestoringPath(path);
    try {
      const response = await fetch(`/api/documents${path}/restore`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to restore document');
      }

      // Remove from list
      setDocuments(documents.filter((d) => d.path !== path));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Restore failed');
    } finally {
      setRestoringPath(null);
    }
  };

  const handlePermanentDelete = async (path: string) => {
    if (!confirm('Permanently delete this document? This cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/documents${path}?permanent=true`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Remove from list
      setDocuments(documents.filter((d) => d.path !== path));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  const handleEmptyTrash = async () => {
    if (!confirm('Permanently delete all documents in trash? This cannot be undone.')) {
      return;
    }

    try {
      // In production, this would call an API to empty trash
      setDocuments([]);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to empty trash');
    }
  };

  return (
    <AppLayout hideSidebar>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="headline-page">Trash</h1>
            <p className="text-sm text-text-muted mt-1">
              Deleted documents can be restored or permanently deleted
            </p>
          </div>

          {documents.length > 0 && (
            <button onClick={handleEmptyTrash} className="btn-ghost text-error">
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
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Empty Trash
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card animate-pulse" style={{ height: '80px' }}>
                <div className="h-4 bg-bg-tertiary rounded w-1/3 mb-2" />
                <div className="h-3 bg-bg-tertiary rounded w-1/2" />
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
              <p className="font-medium text-error">Failed to load trash</p>
              <p className="text-sm text-text-muted">{error}</p>
            </div>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 mx-auto text-text-subtle mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            <h2 className="text-lg font-medium text-text-primary mb-2">
              Trash is empty
            </h2>
            <p className="text-text-muted mb-6">
              Deleted documents will appear here
            </p>
            <Link href="/" className="btn-secondary">
              Back to Documents
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.path}
                className="card flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <svg
                    className="w-5 h-5 text-text-subtle flex-shrink-0"
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
                  <div className="min-w-0">
                    <h3 className="text-text-primary font-medium truncate">
                      {doc.title || doc.path}
                    </h3>
                    <p className="text-xs text-text-subtle">
                      Deleted {formatDistanceToNow(new Date(doc.deletedAt))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleRestore(doc.path)}
                    disabled={restoringPath === doc.path}
                    className="btn-ghost text-sm"
                  >
                    {restoringPath === doc.path ? (
                      <svg
                        className="animate-spin w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                    ) : (
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
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    Restore
                  </button>
                  <button
                    onClick={() => handlePermanentDelete(doc.path)}
                    className="btn-ghost text-error text-sm"
                  >
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
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
