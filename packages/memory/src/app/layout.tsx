import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memory - AI Knowledge Base',
  description: 'A central knowledge base for storing personal and professional context as markdown files. Sub-millisecond reads for AI agents.',
  keywords: ['knowledge base', 'ai', 'mcp', 'markdown', 'claude', 'chatgpt'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg-primary text-text-secondary antialiased">
        {children}
      </body>
    </html>
  );
}
