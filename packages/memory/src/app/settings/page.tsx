'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AppLayout } from '@/components/layout';

interface SettingsData {
  apiKey: {
    id: string;
    prefix: string;
    name: string;
    createdAt: string;
    key?: string; // Full key only on first load or regeneration
  };
  stats: {
    documentCount: number;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<SettingsData | null>(null);
  const [fullApiKey, setFullApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch('/api/settings');

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        throw new Error('Failed to fetch settings');
      }

      const data: SettingsData = await response.json();
      setSettings(data);

      // If a new key was created, save it for display
      if (data.apiKey.key) {
        setFullApiKey(data.apiKey.key);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleRegenerateApiKey = async () => {
    if (!confirm('Are you sure you want to regenerate your API key? The old key will stop working immediately.')) {
      return;
    }

    setIsRegenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/settings/api-key/regenerate', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate API key');
      }

      const data = await response.json();
      setFullApiKey(data.apiKey.key);
      setSettings((prev) =>
        prev
          ? {
              ...prev,
              apiKey: {
                id: data.apiKey.id,
                prefix: data.apiKey.prefix,
                name: prev.apiKey.name,
                createdAt: data.apiKey.createdAt,
              },
            }
          : null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleCopyApiKey = async () => {
    const keyToCopy = fullApiKey || settings?.apiKey.prefix;
    if (keyToCopy) {
      await navigator.clipboard.writeText(keyToCopy);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      router.push('/login');
    }
  };

  // Display key: full key if available, otherwise prefix with masked suffix
  const displayKey = fullApiKey || (settings?.apiKey.prefix ? `${settings.apiKey.prefix}${'*'.repeat(28)}` : '');

  const mcpConfig = `{
  "mcpServers": {
    "memory": {
      "url": "${typeof window !== 'undefined' ? window.location.origin : 'https://memory.yourdomain.com'}/mcp",
      "headers": {
        "Authorization": "Bearer ${fullApiKey || 'YOUR_API_KEY'}"
      }
    }
  }
}`;

  return (
    <AppLayout hideSidebar>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="headline-page mb-8">Settings</h1>

        {error && (
          <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg text-error">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-4 bg-bg-tertiary rounded w-1/4 mb-4" />
                <div className="h-10 bg-bg-tertiary rounded w-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* API Access */}
            <section className="card">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                API Access
              </h2>

              {fullApiKey && (
                <div className="mb-4 p-3 bg-warning/10 border border-warning/20 rounded text-warning text-sm">
                  <strong>Important:</strong> Copy your API key now. For security, it won&apos;t be shown again.
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={displayKey}
                  readOnly
                  className="input font-mono text-sm flex-1"
                />
                <button
                  onClick={handleCopyApiKey}
                  className="btn-secondary"
                  disabled={!displayKey}
                >
                  {isCopied ? (
                    <>
                      <svg
                        className="w-4 h-4 text-success"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Copied
                    </>
                  ) : (
                    <>
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
                          d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                        />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={handleRegenerateApiKey}
                  className="btn-ghost text-warning"
                  disabled={isRegenerating}
                >
                  {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                </button>
              </div>

              {settings?.apiKey.createdAt && (
                <p className="text-xs text-text-subtle mt-2">
                  Created: {new Date(settings.apiKey.createdAt).toLocaleDateString()}
                </p>
              )}
            </section>

            {/* MCP Configuration */}
            <section className="card">
              <h2 className="text-lg font-medium text-text-primary mb-2">
                MCP Configuration
              </h2>
              <p className="text-sm text-text-muted mb-4">
                Add to your <code>claude_desktop_config.json</code> or Claude Code settings:
              </p>
              <pre className="bg-bg-tertiary border border-[rgba(255,255,255,0.08)] rounded-lg p-4 overflow-x-auto text-sm">
                <code>{mcpConfig}</code>
              </pre>
              <button
                onClick={() => navigator.clipboard.writeText(mcpConfig)}
                className="btn-ghost mt-3"
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
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy config
              </button>
            </section>

            {/* System Health */}
            <section className="card">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                System Health
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-[rgba(255,255,255,0.08)]">
                  <span className="text-text-muted">Database</span>
                  <span className="flex items-center gap-2 text-success">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Connected
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-muted">Documents</span>
                  <span className="text-text-primary">
                    {settings?.stats.documentCount || 0}
                  </span>
                </div>
              </div>
            </section>

            {/* Version History Settings */}
            <section className="card">
              <h2 className="text-lg font-medium text-text-primary mb-4">
                Version History
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-text-muted">Keep last</span>
                <select className="input w-24" defaultValue="10">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                </select>
                <span className="text-text-muted">versions per document</span>
              </div>
            </section>

            {/* Sign Out */}
            <section>
              <button onClick={handleSignOut} className="btn-secondary">
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
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Sign Out
              </button>
            </section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
