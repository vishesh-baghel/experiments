/**
 * Posts Page
 */

import { PostsList } from '@/components/posts-list';
import { getCurrentUserId } from '@/lib/auth';

export default function PostsPage() {
  const userId = getCurrentUserId();

  return (
    <main className="container mx-auto px-4 py-8">
      <PostsList userId={userId} />
    </main>
  );
}
