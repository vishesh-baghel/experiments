/**
 * Creators Page
 */

import { CreatorsManager } from '@/components/creators-manager';
import { getCurrentUserId } from '@/lib/auth';

export default function CreatorsPage() {
  const userId = getCurrentUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      <CreatorsManager userId={userId} />
    </main>
  );
}
