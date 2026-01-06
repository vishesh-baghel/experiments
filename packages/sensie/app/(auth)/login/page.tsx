'use client';

import { useState } from 'react';
import { Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Login Page - Minimal design
 */

type Mode = 'owner' | 'visitor';

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('owner');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // API call would go here
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  const handleVisitorStart = async () => {
    setIsLoading(true);
    // API call would go here
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <h1 className="text-2xl font-medium text-center text-[hsl(var(--foreground))] mb-8">
          sensie
        </h1>

        {/* Card */}
        <div className="border border-[hsl(var(--border))] rounded-lg bg-[hsl(var(--card))] overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[hsl(var(--border))]">
            <button
              onClick={() => setMode('owner')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                mode === 'owner'
                  ? 'text-[hsl(var(--foreground))] border-b-2 border-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              Owner
            </button>
            <button
              onClick={() => setMode('visitor')}
              className={cn(
                'flex-1 py-3 text-sm font-medium transition-colors',
                mode === 'visitor'
                  ? 'text-[hsl(var(--foreground))] border-b-2 border-[hsl(var(--foreground))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              )}
            >
              Visitor
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {mode === 'owner' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter your passphrase"
                      className="w-full px-4 py-3 pr-12 bg-[hsl(var(--background))] border border-[hsl(var(--border))] rounded-lg text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:border-[hsl(var(--foreground))/0.3]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      {showPassphrase ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-[hsl(var(--destructive))]">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !passphrase.trim()}
                  className="w-full py-3 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-medium rounded-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entering...
                    </>
                  ) : (
                    <>
                      Enter
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            )}

            {mode === 'visitor' && (
              <div className="space-y-4">
                <div className="text-center py-4">
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Try sensie without creating an account.
                    Progress will be saved temporarily in your browser.
                  </p>
                </div>

                <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                    Full access to learning features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--success))]" />
                    Progress saved in browser
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--warning))]" />
                    Limited to 1 active topic
                  </li>
                </ul>

                <button
                  onClick={handleVisitorStart}
                  disabled={isLoading}
                  className="w-full py-3 border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium rounded-lg hover:bg-[hsl(var(--muted))] transition-colors flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Continue as visitor
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
