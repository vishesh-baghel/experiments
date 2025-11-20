/**
 * Settings Page
 */

import { ToneConfigComponent } from '@/components/tone-config';
import { getCurrentUserId } from '@/lib/auth';

export default function SettingsPage() {
  const userId = getCurrentUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      <ToneConfigComponent userId={userId} />
    </main>
  );
}
