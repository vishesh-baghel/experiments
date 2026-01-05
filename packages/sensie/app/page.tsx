/**
 * Home/Landing Page
 *
 * Shows:
 * - Welcome message
 * - Login/Start options
 * - Brief intro to Sensie
 */

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Sensie
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Your AI learning guide. Master any topic through Socratic questioning.
        </p>
        <div className="flex gap-4 justify-center">
          {/* Login buttons will go here */}
          <a
            href="/login"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Get Started
          </a>
        </div>
      </div>
    </main>
  );
}
