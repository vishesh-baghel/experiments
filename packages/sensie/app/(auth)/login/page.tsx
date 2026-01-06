'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, User, Key, ArrowRight, Loader2 } from 'lucide-react';
import { SensieAvatar } from '@/components/chat/sensie-avatar';

/**
 * Login Page - Enter the Dojo
 *
 * Features:
 * - Owner passphrase login
 * - Visitor mode (quick start)
 * - First-time setup flow
 */

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'visitor' | 'setup'>('login');
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect would happen here
    }, 1500);
  };

  const handleVisitorStart = async () => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Redirect would happen here
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[hsl(var(--background))] paper-texture">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-[hsl(var(--ki-orange))]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-[hsl(var(--ki-amber))]/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="inline-block"
          >
            <SensieAvatar size="lg" className="mx-auto mb-4" />
          </motion.div>
          <h1 className="sensie-voice text-3xl font-medium text-[hsl(var(--foreground))] mb-2">
            Enter the Dojo
          </h1>
          <p className="text-[hsl(var(--muted-foreground))]">
            Begin your journey of learning
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-2xl shadow-xl overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-[hsl(var(--border))]">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-[hsl(var(--ki-orange))] border-b-2 border-[hsl(var(--ki-orange))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <Key className="w-4 h-4 inline mr-2" />
              Owner
            </button>
            <button
              onClick={() => setMode('visitor')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                mode === 'visitor'
                  ? 'text-[hsl(var(--ki-orange))] border-b-2 border-[hsl(var(--ki-orange))]'
                  : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Visitor
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {mode === 'login' && (
              <motion.form
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleSubmit}
                className="space-y-5"
              >
                <div>
                  <label className="block text-sm font-medium text-[hsl(var(--foreground))] mb-2">
                    Passphrase
                  </label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="Enter your secret passphrase"
                      className="w-full px-4 py-3 pr-12 bg-[hsl(var(--input))] border border-[hsl(var(--border))] rounded-xl text-[hsl(var(--foreground))] placeholder:text-[hsl(var(--muted-foreground))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ki-orange))]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
                    >
                      {showPassphrase ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500">{error}</p>
                )}

                <motion.button
                  type="submit"
                  disabled={isLoading || !passphrase.trim()}
                  className="w-full py-3 bg-gradient-to-br from-[hsl(25,95%,53%)] to-[hsl(30,90%,48%)] text-white font-medium rounded-xl disabled:opacity-50 flex items-center justify-center gap-2"
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Entering...
                    </>
                  ) : (
                    <>
                      Enter Dojo
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.form>
            )}

            {mode === 'visitor' && (
              <motion.div
                key="visitor"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="text-center py-4">
                  <User className="w-12 h-12 text-[hsl(var(--muted-foreground))] mx-auto mb-4" />
                  <h3 className="font-medium text-[hsl(var(--foreground))] mb-2">
                    Visitor Mode
                  </h3>
                  <p className="text-sm text-[hsl(var(--muted-foreground))]">
                    Try Sensie without creating an account.
                    Your progress will be saved temporarily.
                  </p>
                </div>

                <ul className="text-sm text-[hsl(var(--muted-foreground))] space-y-2">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Full access to learning features
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Progress saved in browser
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Limited to 1 active topic
                  </li>
                </ul>

                <motion.button
                  onClick={handleVisitorStart}
                  disabled={isLoading}
                  className="w-full py-3 bg-[hsl(var(--muted))] text-[hsl(var(--foreground))] font-medium rounded-xl hover:bg-[hsl(var(--muted))]/80 transition-colors flex items-center justify-center gap-2"
                  whileHover={{ scale: isLoading ? 1 : 1.01 }}
                  whileTap={{ scale: isLoading ? 1 : 0.99 }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      Start as Visitor
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-[hsl(var(--muted-foreground))] mt-6">
          "The journey of a thousand miles begins with a single step."
        </p>
      </motion.div>
    </div>
  );
}
