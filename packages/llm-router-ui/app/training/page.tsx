'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Upload, Plus, Trash2, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

type ComplexityLevel = 'simple' | 'moderate' | 'complex' | 'reasoning';

interface TrainingExample {
  query: string;
  complexity: ComplexityLevel;
}

interface TrainingStats {
  total: number;
  simple: number;
  moderate: number;
  complex: number;
  reasoning: number;
}

export default function TrainingPage() {
  const [examples, setExamples] = useState<TrainingExample[]>([]);
  const [stats, setStats] = useState<TrainingStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  
  // Form state
  const [newQuery, setNewQuery] = useState('');
  const [newComplexity, setNewComplexity] = useState<ComplexityLevel>('simple');
  const [filterComplexity, setFilterComplexity] = useState<ComplexityLevel | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load training data
  useEffect(() => {
    loadTrainingData();
  }, []);

  const loadTrainingData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/training');
      const data = await response.json();
      setExamples(data.examples);
      setStats(data.stats);
    } catch (error) {
      console.error('Failed to load training data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addExample = async () => {
    if (!newQuery.trim()) return;

    try {
      const response = await fetch('/api/training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: newQuery, complexity: newComplexity }),
      });

      if (response.ok) {
        setNewQuery('');
        await loadTrainingData();
      }
    } catch (error) {
      console.error('Failed to add example:', error);
    }
  };

  const deleteExample = async (index: number) => {
    try {
      const response = await fetch('/api/training', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ index }),
      });

      if (response.ok) {
        await loadTrainingData();
      }
    } catch (error) {
      console.error('Failed to delete example:', error);
    }
  };

  const uploadToUpstash = async () => {
    try {
      setIsUploading(true);
      setUploadStatus('idle');
      setUploadMessage('Generating embeddings and uploading to Upstash...');

      const response = await fetch('/api/training/upload', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setUploadStatus('success');
        setUploadMessage(data.message || 'Successfully uploaded training data to Upstash!');
      } else {
        setUploadStatus('error');
        setUploadMessage(data.error || 'Failed to upload training data');
      }
    } catch (error) {
      setUploadStatus('error');
      setUploadMessage('Failed to upload training data');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter examples
  const filteredExamples = examples.filter((example) => {
    const matchesComplexity = filterComplexity === 'all' || example.complexity === filterComplexity;
    const matchesSearch = example.query.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesComplexity && matchesSearch;
  });

  const getComplexityColor = (complexity: ComplexityLevel) => {
    switch (complexity) {
      case 'simple':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'complex':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'reasoning':
        return 'bg-purple-100 text-purple-800 border-purple-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Training Data Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage ML classifier training examples and upload to Upstash Vector
          </p>
        </div>
        <Button
          onClick={uploadToUpstash}
          disabled={isUploading}
          size="lg"
          className="gap-2"
        >
          {isUploading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              Upload to Upstash
            </>
          )}
        </Button>
      </div>

      {/* Upload Status */}
      {uploadStatus !== 'idle' && (
        <Card className={uploadStatus === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {uploadStatus === 'success' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
              <p className={uploadStatus === 'success' ? 'text-green-800' : 'text-red-800'}>
                {uploadMessage}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Simple</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.simple}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Moderate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.moderate}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Complex</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.complex}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Reasoning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.reasoning}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add New Example */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Training Example
          </CardTitle>
          <CardDescription>
            Add a new query with its complexity level to improve classifier accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="query">Query</Label>
            <Textarea
              id="query"
              placeholder="Enter a sample query..."
              value={newQuery}
              onChange={(e) => setNewQuery(e.target.value)}
              rows={3}
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="complexity">Complexity Level</Label>
              <Select value={newComplexity} onValueChange={(v) => setNewComplexity(v as ComplexityLevel)}>
                <SelectTrigger id="complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                  <SelectItem value="reasoning">Reasoning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addExample} disabled={!newQuery.trim()}>
                <Plus className="w-4 h-4 mr-2" />
                Add Example
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Training Examples ({filteredExamples.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterComplexity} onValueChange={(v) => setFilterComplexity(v as 'all' | 'simple' | 'moderate' | 'complex' | 'reasoning')}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Complexity</SelectItem>
                <SelectItem value="simple">Simple</SelectItem>
                <SelectItem value="moderate">Moderate</SelectItem>
                <SelectItem value="complex">Complex</SelectItem>
                <SelectItem value="reasoning">Reasoning</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Examples List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading training data...</div>
            ) : filteredExamples.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No examples found</div>
            ) : (
              filteredExamples.map((example, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <Badge className={getComplexityColor(example.complexity)}>
                    {example.complexity}
                  </Badge>
                  <div className="flex-1 text-sm">{example.query}</div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteExample(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
