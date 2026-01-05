import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Sensie - AI Learning Guide',
  description: 'Learn through Socratic questioning with your personal AI sensei',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
