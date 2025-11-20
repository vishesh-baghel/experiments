/**
 * Creators Manager Component
 * Manage tracked creators for inspiration
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatRelativeTime } from '@/lib/utils';

interface Creator {
  id: string;
  xHandle: string;
  isActive: boolean;
  createdAt: Date;
}

interface CreatorsManagerProps {
  userId: string;
  initialCreators?: Creator[];
}

export function CreatorsManager({ userId, initialCreators = [] }: CreatorsManagerProps) {
  const [creators, setCreators] = useState<Creator[]>(initialCreators);
  const [newHandle, setNewHandle] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAddCreator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHandle.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/creators', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          xHandle: newHandle.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to add creator');

      const { creator } = await response.json();
      setCreators([creator, ...creators]);
      setNewHandle('');
    } catch (error) {
      console.error('Error adding creator:', error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleCreator = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/creators/${creatorId}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Failed to toggle creator');

      const { creator } = await response.json();
      setCreators(creators.map(c => c.id === creatorId ? creator : c));
    } catch (error) {
      console.error('Error toggling creator:', error);
    }
  };

  const activeCreators = creators.filter(c => c.isActive);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">tracked creators</h1>
        <p className="text-muted-foreground">
          follow creators you admire for content inspiration
        </p>
      </div>

      {/* Add Creator Form */}
      <Card>
        <CardHeader>
          <CardTitle>add creator</CardTitle>
          <CardDescription>
            enter an X handle to track their content style
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddCreator} className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="handle" className="sr-only">X Handle</Label>
              <Input
                id="handle"
                placeholder="@username"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                disabled={isAdding}
              />
            </div>
            <Button type="submit" disabled={!newHandle.trim() || isAdding}>
              {isAdding ? 'adding...' : 'add'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>active creators</CardDescription>
            <CardTitle className="text-4xl">{activeCreators.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>total tracked</CardDescription>
            <CardTitle className="text-4xl">{creators.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Creators List */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">all creators</h2>
        {creators.map((creator) => (
          <Card key={creator.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${creator.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                <div>
                  <p className="font-medium">{creator.xHandle}</p>
                  <p className="text-xs text-muted-foreground">
                    added {formatRelativeTime(new Date(creator.createdAt))}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={creator.isActive ? 'outline' : 'default'}
                onClick={() => handleToggleCreator(creator.id)}
              >
                {creator.isActive ? 'pause' : 'activate'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {creators.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>no creators tracked yet</p>
          <p className="text-sm mt-2">add creators to get inspired by their content style</p>
        </div>
      )}
    </div>
  );
}
