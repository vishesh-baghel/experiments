/**
 * Outline Viewer Component
 * Displays generated outline for content creation
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface OutlineSection {
  heading: string;
  keyPoints: string[];
  toneGuidance?: string;
  examples?: string[];
}

interface ContentOutline {
  format: string;
  sections: OutlineSection[];
  estimatedLength: number;
  toneReminders: string[];
}

interface OutlineViewerProps {
  outline: ContentOutline;
  ideaTitle: string;
  contentPillar: string;
  onSaveDraft?: (content: string) => void;
}

export function OutlineViewer({
  outline,
  ideaTitle,
  contentPillar,
  onSaveDraft,
}: OutlineViewerProps) {
  const [draftContent, setDraftContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSaveDraft) return;
    setIsSaving(true);
    try {
      await onSaveDraft(draftContent);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">{ideaTitle}</h1>
          <Badge>{contentPillar}</Badge>
        </div>
        <p className="text-muted-foreground">
          format: {outline.format} • estimated length: {outline.estimatedLength} chars
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Outline Panel */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">outline</h2>

          {/* Tone Reminders */}
          {outline.toneReminders.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">tone reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {outline.toneReminders.map((reminder, i) => (
                    <li key={i}>• {reminder}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Sections */}
          {outline.sections.map((section, idx) => (
            <Card key={idx}>
              <CardHeader>
                <CardTitle className="text-base">{section.heading}</CardTitle>
                {section.toneGuidance && (
                  <CardDescription className="italic">
                    {section.toneGuidance}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-2">key points:</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {section.keyPoints.map((point, i) => (
                      <li key={i}>• {point}</li>
                    ))}
                  </ul>
                </div>
                {section.examples && section.examples.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">examples:</p>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {section.examples.map((example, i) => (
                        <li key={i} className="italic">
                          &quot;{example}&quot;
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Writing Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">write your content</h2>
            <span className="text-sm text-muted-foreground">
              {draftContent.length} / {outline.estimatedLength} chars
            </span>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Textarea
                placeholder="start writing in your authentic voice..."
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                className="min-h-[500px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!draftContent.trim() || isSaving}
              className="flex-1"
            >
              {isSaving ? 'saving...' : 'save draft'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setDraftContent('')}
              disabled={!draftContent}
            >
              clear
            </Button>
          </div>

          {/* Tips */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <p className="text-sm font-medium mb-2">writing tips:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• use the outline as a guide, not a script</li>
                <li>• write in your natural voice</li>
                <li>• include specific numbers and examples</li>
                <li>• show the struggle, not just the win</li>
                <li>• keep it lowercase (except proper nouns)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
