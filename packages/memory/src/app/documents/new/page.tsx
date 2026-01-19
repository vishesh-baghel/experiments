'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AppLayout } from '@/components/layout';
import { isValidPath } from '@/lib/utils';

function NewDocumentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialFolder = searchParams.get('folder') || '/';

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [path, setPath] = useState(initialFolder === '/' ? '/' : initialFolder + '/');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [type, setType] = useState('');
  const [source, setSource] = useState('manual');

  const handleSave = async () => {
    // Validate path
    if (!path || !isValidPath(path)) {
      setError('Invalid path. Must start with / and contain only letters, numbers, dashes, and underscores.');
      return;
    }

    if (!content.trim()) {
      setError('Content is required.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path,
          content,
          title: title || undefined,
          tags: tags.length > 0 ? tags : undefined,
          type: type || undefined,
          source: source || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create document');
      }

      router.push(`/documents${path}`);
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

  return (
    <AppLayout hideSidebar>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="headline-page">New Document</h1>
            <p className="text-sm text-text-muted mt-1">
              Create a new document in your knowledge base
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="btn-secondary">
              Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={isSaving || !content || !path}
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
                  Creating...
                </>
              ) : (
                'Create'
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        <div className="card space-y-6">
          {/* Path */}
          <div>
            <label htmlFor="path" className="label block mb-2">
              Path
            </label>
            <input
              type="text"
              id="path"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              className="input font-mono"
              placeholder="/folder/document-name"
              required
            />
            <p className="text-xs text-text-subtle mt-1">
              Full path including folder, e.g., /work/projects/my-project
            </p>
          </div>

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
              className="input font-mono text-sm min-h-[300px] resize-y"
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
                <option value="manual">Manual</option>
                <option value="claude-code">Claude Code</option>
                <option value="claude-desktop">Claude Desktop</option>
                <option value="chatgpt">ChatGPT</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default function NewDocumentPage() {
  return (
    <Suspense fallback={
      <AppLayout hideSidebar>
        <div className="max-w-4xl mx-auto p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-bg-tertiary rounded w-1/3 mb-4" />
            <div className="card">
              <div className="h-10 bg-bg-tertiary rounded mb-4" />
              <div className="h-10 bg-bg-tertiary rounded mb-4" />
              <div className="h-64 bg-bg-tertiary rounded" />
            </div>
          </div>
        </div>
      </AppLayout>
    }>
      <NewDocumentContent />
    </Suspense>
  );
}
