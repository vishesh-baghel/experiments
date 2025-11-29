/**
 * Creators Page
 */

import { redirect } from 'next/navigation';
import { CreatorsManager } from '@/components/creators-manager';
import { getCurrentUserId } from '@/lib/auth';

export default async function CreatorsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <CreatorsManager userId={userId} />
    </main>
  );
}
