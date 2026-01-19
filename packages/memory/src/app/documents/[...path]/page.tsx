'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { LatencyBadge } from '@/components/ui';
import { formatDate } from '@/lib/utils';

interface Document {
  path: string;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  source?: string;
  type?: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  latencyMs: number;
}

export default function DocumentViewPage() {
  const params = useParams();
  const router = useRouter();
  const pathSegments = params.path as string[];
  const documentPath = '/' + pathSegments.join('/');

  const [document, setDocument] = useState<Document | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDocument = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents${documentPath}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Document not found');
        }
        throw new Error('Failed to fetch document');
      }

      const data = await response.json();
      setDocument(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [documentPath]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/documents${documentPath}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      router.push('/');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };

  // Render markdown to HTML (basic implementation)
  const renderMarkdown = (content: string): string => {
    // Basic markdown rendering - in production, use a proper library
    let html = content
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/gim, '<pre><code class="language-$1">$2</code></pre>')
      // Inline code
      .replace(/`(.*?)`/gim, '<code>$1</code>')
      // Links
      .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Lists
      .replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>')
      // Paragraphs
      .replace(/\n\n/gim, '</p><p>')
      // Line breaks
      .replace(/\n/gim, '<br>');

    // Wrap in paragraph
    html = '<p>' + html + '</p>';

    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p><h/g, '<h');
    html = html.replace(/<\/h(\d)><\/p>/g, '</h$1>');
    html = html.replace(/<p><pre>/g, '<pre>');
    html = html.replace(/<\/pre><\/p>/g, '</pre>');

    // Wrap lists
    html = html.replace(/(<li>.*?<\/li>)+/gim, '<ul>$&</ul>');

    return html;
  };

  return (
    <AppLayout hideSidebar>
      <div className="max-w-4xl mx-auto p-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-text-muted mb-6">
          <Link href="/" className="hover:text-text-primary">
            Documents
          </Link>
          {pathSegments.slice(0, -1).map((segment, index) => (
            <span key={index} className="flex items-center gap-2">
              <span>/</span>
              <Link
                href={`/?folder=/${pathSegments.slice(0, index + 1).join('/')}`}
                className="hover:text-text-primary"
              >
                {segment}
              </Link>
            </span>
          ))}
          <span>/</span>
          <span className="text-text-primary">{pathSegments[pathSegments.length - 1]}</span>
        </nav>

        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/2 mb-4" />
            <div className="h-4 bg-bg-tertiary rounded w-full mb-2" />
            <div className="h-4 bg-bg-tertiary rounded w-3/4 mb-2" />
            <div className="h-4 bg-bg-tertiary rounded w-5/6" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <svg
              className="w-12 h-12 mx-auto text-error mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h2 className="text-lg font-medium text-text-primary mb-2">{error}</h2>
            <Link href="/" className="btn-primary mt-4">
              Back to Documents
            </Link>
          </div>
        ) : document ? (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="headline-page mb-2">{document.title || documentPath}</h1>
                <div className="flex items-center gap-3 text-sm text-text-muted">
                  <span>{documentPath}</span>
                  <LatencyBadge latencyMs={document.latencyMs} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link href={`/documents${documentPath}/edit`} className="btn-primary">
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Link>

                {/* More menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="btn-ghost p-2"
                    aria-label="More options"
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
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>

                  {showMenu && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowMenu(false)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-lg shadow-lg z-20">
                        <button
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-error hover:bg-error/10 rounded-lg"
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="card mb-6">
              <div
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: renderMarkdown(document.content) }}
              />
            </div>

            {/* Metadata */}
            <div className="card">
              {/* Tags */}
              {document.tags.length > 0 && (
                <div className="mb-4">
                  <span className="label block mb-2">Tags</span>
                  <div className="flex flex-wrap gap-2">
                    {document.tags.map((tag) => (
                      <Link
                        key={tag}
                        href={`/?tag=${tag}`}
                        className="tag tag-interactive"
                      >
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                {document.type && (
                  <div>
                    <span className="label block mb-1">Type</span>
                    <span className="text-text-primary">{document.type}</span>
                  </div>
                )}
                {document.source && (
                  <div>
                    <span className="label block mb-1">Source</span>
                    <span className="text-text-primary">{document.source}</span>
                  </div>
                )}
                <div>
                  <span className="label block mb-1">Version</span>
                  <span className="text-text-primary">{document.version}</span>
                </div>
                <div>
                  <span className="label block mb-1">Created</span>
                  <span className="text-text-primary">
                    {formatDate(new Date(document.createdAt))}
                  </span>
                </div>
                <div>
                  <span className="label block mb-1">Updated</span>
                  <span className="text-text-primary">
                    {formatDate(new Date(document.updatedAt))}
                  </span>
                </div>
              </div>

              {/* Latency footer */}
              <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.08)]">
                <LatencyBadge latencyMs={document.latencyMs} />
              </div>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
