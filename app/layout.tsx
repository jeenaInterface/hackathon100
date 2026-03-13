import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Business Scenario → Playwright',
  description: 'Upload scenarios, convert to Playwright tests, run via Copilot, view HTML reports',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
