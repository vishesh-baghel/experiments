/**
 * Settings Page
 */

import { redirect } from 'next/navigation';
import { ToneConfigComponent } from '@/components/tone-config';
import { getCurrentUserId } from '@/lib/auth';

export default async function SettingsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <ToneConfigComponent userId={userId} />
    </main>
  );
}
