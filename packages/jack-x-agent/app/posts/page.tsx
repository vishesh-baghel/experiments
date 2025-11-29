/**
 * Posts Page - Shows Drafts
 */

import { redirect } from 'next/navigation';
import { PostsList } from '@/components/posts-list';
import { getCurrentUserId } from '@/lib/auth';
import { getDraftsForUser } from '@/lib/db/drafts';

export default async function PostsPage() {
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect('/auth');
  }

  // Fetch all drafts for the user
  const drafts = await getDraftsForUser(userId);

  // Transform drafts to match the PostsList interface
  const posts = drafts.map(draft => ({
    id: draft.id,
    content: draft.content,
    contentType: draft.outline.format,
    contentPillar: draft.outline.contentIdea.contentPillar,
    isMarkedGood: draft.post?.isMarkedGood || false,
    markedGoodAt: draft.post?.markedGoodAt || null,
    createdAt: draft.createdAt,
  }));

  return (
    <main className="container mx-auto px-4 py-8">
      <PostsList userId={userId} initialPosts={posts} />
    </main>
  );
}
