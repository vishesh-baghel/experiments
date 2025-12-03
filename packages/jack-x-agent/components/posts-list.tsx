/**
 * Posts List Component
 * Display user's posts with "mark as good" functionality
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRelativeTime, getPillarColor } from '@/lib/utils';

interface Post {
  id: string;
  draftId: string;
  hasPost: boolean;
  content: string;
  contentType: string;
  contentPillar: string;
  isMarkedGood: boolean;
  markedGoodAt: Date | null;
  createdAt: Date;
}

interface PostsListProps {
  userId: string;
  initialPosts?: Post[];
}

export function PostsList({ userId, initialPosts = [] }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<'all' | 'good'>('all');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleMarkAsGood = async (post: Post) => {
    setLoadingId(post.draftId);
    setError(null);
    
    try {
      // If no post record exists yet, create one first
      if (!post.hasPost) {
        const createResponse = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId,
            draftId: post.draftId,
            content: post.content,
            contentType: post.contentType,
            contentPillar: post.contentPillar,
          }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create post record');
        }

        const { post: newPost } = await createResponse.json();
        // Update local state with the new post ID
        setPosts(posts.map(p => 
          p.draftId === post.draftId 
            ? { ...p, id: newPost.id, hasPost: true } 
            : p
        ));
        post = { ...post, id: newPost.id, hasPost: true };
      }

      // Now mark as good
      const response = await fetch(`/api/posts/${post.id}/mark-good`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to mark post as good');
      }

      const { post: updatedPost } = await response.json();
      setPosts(posts.map(p => 
        p.draftId === post.draftId 
          ? { ...p, id: updatedPost.id, hasPost: true, isMarkedGood: true, markedGoodAt: new Date(updatedPost.markedGoodAt) } 
          : p
      ));
    } catch (err) {
      console.error('Error marking post:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoadingId(null);
    }
  };

  const filteredPosts = filter === 'good' 
    ? posts.filter(p => p.isMarkedGood)
    : posts;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">my drafts</h1>
          <p className="text-muted-foreground">
            saved drafts from your outlines - mark your best ones so jack learns your voice
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md text-sm">
          {error}
          <button 
            onClick={() => setError(null)} 
            className="ml-2 underline cursor-pointer"
          >
            dismiss
          </button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
            filter === 'all'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          all drafts ({posts.length})
        </button>
        <button
          onClick={() => setFilter('good')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 cursor-pointer ${
            filter === 'good'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
          }`}
        >
          good drafts ({posts.filter(p => p.isMarkedGood).length})
        </button>
      </div>

      {/* Posts List */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getPillarColor(post.contentPillar)}>
                      {post.contentPillar}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.contentType}
                    </span>
                    {post.isMarkedGood && (
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                        ✓ good
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="text-xs">
                    {formatRelativeTime(new Date(post.createdAt))}
                    {post.markedGoodAt && ` • marked good ${formatRelativeTime(new Date(post.markedGoodAt))}`}
                  </CardDescription>
                </div>
                {!post.isMarkedGood && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkAsGood(post)}
                    disabled={loadingId === post.draftId}
                  >
                    {loadingId === post.draftId ? 'saving...' : 'mark as good'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="whitespace-pre-wrap text-sm font-mono bg-muted/50 p-4 rounded-md">
                {post.content}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>no {filter === 'good' ? 'good ' : ''}drafts yet</p>
          <p className="text-sm mt-2">
            {filter === 'good' 
              ? 'mark your best drafts so jack can learn your voice'
              : 'create an outline and save a draft to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
}
