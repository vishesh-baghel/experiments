/**
 * Outline Page
 * View and write content from outline
 */

import { OutlineViewer } from '@/components/outline-viewer';
import { getOutlineById } from '@/lib/db/outlines';
import { notFound } from 'next/navigation';

export default async function OutlinePage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Fetch outline from database
  const outlineData = await getOutlineById(id);
  
  if (!outlineData || !outlineData.contentIdea) {
    notFound();
  }

  // Parse sections from JSON
  const outline = {
    format: outlineData.format,
    estimatedLength: outlineData.estimatedLength,
    sections: outlineData.sections as Array<{
      heading: string;
      keyPoints: string[];
      toneGuidance?: string;
      examples?: string[];
    }>,
    toneReminders: outlineData.toneReminders,
  };

  return (
    <main className="container mx-auto px-4 py-8">
      <OutlineViewer
        outline={outline}
        ideaTitle={outlineData.contentIdea.title}
        contentPillar={outlineData.contentIdea.contentPillar}
      />
    </main>
  );
}
