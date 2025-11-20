/**
 * Home Page - Ideas Dashboard
 */

import { IdeasDashboard } from '@/components/ideas-dashboard';
import { getCurrentUserId } from '@/lib/auth';

export default function Home() {
  const userId = getCurrentUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      <IdeasDashboard userId={userId} />
    </main>
  );
}
