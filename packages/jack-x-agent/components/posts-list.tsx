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

export function PostsList({ initialPosts = [] }: PostsListProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [filter, setFilter] = useState<'all' | 'good'>('all');

  const handleMarkAsGood = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/mark-good`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to mark post');

      const { post } = await response.json();
      setPosts(posts.map(p => p.id === postId ? { ...p, isMarkedGood: true, markedGoodAt: new Date(post.markedGoodAt) } : p));
    } catch (error) {
      console.error('Error marking post:', error);
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
          <h1 className="text-3xl font-bold">my posts</h1>
          <p className="text-muted-foreground">
            mark your best posts so jack learns your voice
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          all posts ({posts.length})
        </button>
        <button
          onClick={() => setFilter('good')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'good'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          good posts ({posts.filter(p => p.isMarkedGood).length})
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
                    onClick={() => handleMarkAsGood(post.id)}
                  >
                    mark as good
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
          <p>no {filter === 'good' ? 'good ' : ''}posts yet</p>
          <p className="text-sm mt-2">
            {filter === 'good' 
              ? 'mark your best posts so jack can learn your voice'
              : 'create your first post to get started'
            }
          </p>
        </div>
      )}
    </div>
  );
}
