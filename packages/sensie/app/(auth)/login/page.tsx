'use client';

/**
 * Login Page
 *
 * Modes:
 * - Owner: Enter passphrase
 * - Visitor: Quick start without account
 * - First-time: Setup passphrase
 */

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-8">
          Enter the Dojo
        </h1>

        <div className="space-y-4">
          {/* Passphrase login form */}
          <div className="p-6 border rounded-lg">
            <h2 className="font-semibold mb-4">Owner Login</h2>
            <form className="space-y-4">
              <input
                type="password"
                placeholder="Enter passphrase"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg"
              >
                Enter
              </button>
            </form>
          </div>

          {/* Visitor option */}
          <div className="text-center">
            <p className="text-muted-foreground mb-2">or</p>
            <button className="text-primary hover:underline">
              Continue as Visitor
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
