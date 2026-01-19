'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';

interface Document {
  path: string;
  title: string;
  content: string;
  tags: string[];
  metadata: Record<string, unknown>;
  source?: string;
  type?: string;
  version: number;
}

export default function DocumentEditPage() {
  const params = useParams();
  const router = useRouter();
  const pathSegments = params.path as string[];
  const documentPath = '/' + pathSegments.join('/');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('');
  const [metadata, setMetadata] = useState<{ key: string; value: string }[]>([]);

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

      const data: Document = await response.json();
      setTitle(data.title || '');
      setContent(data.content || '');
      setTags(data.tags || []);
      setType(data.type || '');
      setSource(data.source || '');
      setMetadata(
        Object.entries(data.metadata || {}).map(([key, value]) => ({
          key,
          value: String(value),
        }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [documentPath]);

  useEffect(() => {
    fetchDocument();
  }, [fetchDocument]);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [title, content, tags, type, source, metadata]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/documents${documentPath}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          title: title || undefined,
          tags: tags.length > 0 ? tags : undefined,
          type: type || undefined,
          source: source || undefined,
          metadata:
            metadata.length > 0
              ? Object.fromEntries(metadata.map(({ key, value }) => [key, value]))
              : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save document');
      }

      setHasChanges(false);
      router.push(`/documents${documentPath}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddMetadata = () => {
    setMetadata([...metadata, { key: '', value: '' }]);
  };

  const handleRemoveMetadata = (index: number) => {
    setMetadata(metadata.filter((_, i) => i !== index));
  };

  const handleMetadataChange = (
    index: number,
    field: 'key' | 'value',
    value: string
  ) => {
    const updated = [...metadata];
    updated[index][field] = value;
    setMetadata(updated);
  };

  // Warn about unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasChanges]);

  return (
    <AppLayout hideSidebar>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="headline-page">Edit Document</h1>
            <p className="text-sm text-text-muted mt-1">{documentPath}</p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href={`/documents${documentPath}`}
              className="btn-secondary"
              onClick={(e) => {
                if (hasChanges && !confirm('Discard unsaved changes?')) {
                  e.preventDefault();
                }
              }}
            >
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving || !content}
              className="btn-primary"
            >
              {isSaving ? (
                <>
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
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="card animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4" />
            <div className="h-64 bg-bg-tertiary rounded mb-4" />
            <div className="h-8 bg-bg-tertiary rounded w-1/2" />
          </div>
        ) : (
          <div className="card space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="label block mb-2">
                Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
                placeholder="Document title (optional, extracted from # heading)"
              />
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="label block mb-2">
                Content (Markdown)
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="input font-mono text-sm min-h-[400px] resize-y"
                placeholder="# Document Title&#10;&#10;Write your content here..."
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="label block mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="ml-1 hover:text-error"
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg
                        className="w-3 h-3"
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
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="input flex-1"
                  placeholder="Add a tag..."
                />
                <button onClick={handleAddTag} className="btn-secondary">
                  Add
                </button>
              </div>
            </div>

            {/* Type and Source */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="type" className="label block mb-2">
                  Type
                </label>
                <select
                  id="type"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="input"
                >
                  <option value="">Select type...</option>
                  <option value="note">Note</option>
                  <option value="spec">Spec</option>
                  <option value="meeting">Meeting</option>
                  <option value="reference">Reference</option>
                  <option value="guide">Guide</option>
                </select>
              </div>
              <div>
                <label htmlFor="source" className="label block mb-2">
                  Source
                </label>
                <select
                  id="source"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="input"
                >
                  <option value="">Select source...</option>
                  <option value="manual">Manual</option>
                  <option value="claude-code">Claude Code</option>
                  <option value="claude-desktop">Claude Desktop</option>
                  <option value="chatgpt">ChatGPT</option>
                </select>
              </div>
            </div>

            {/* Custom Metadata */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label">Custom Metadata</label>
                <button onClick={handleAddMetadata} className="btn-ghost text-sm">
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
                  Add Field
                </button>
              </div>
              {metadata.length === 0 ? (
                <p className="text-sm text-text-subtle">
                  No custom metadata. Click &quot;Add Field&quot; to add key-value pairs.
                </p>
              ) : (
                <div className="space-y-2">
                  {metadata.map((item, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={item.key}
                        onChange={(e) =>
                          handleMetadataChange(index, 'key', e.target.value)
                        }
                        className="input flex-1"
                        placeholder="Key"
                      />
                      <input
                        type="text"
                        value={item.value}
                        onChange={(e) =>
                          handleMetadataChange(index, 'value', e.target.value)
                        }
                        className="input flex-1"
                        placeholder="Value"
                      />
                      <button
                        onClick={() => handleRemoveMetadata(index)}
                        className="btn-ghost text-error"
                        aria-label="Remove field"
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
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
