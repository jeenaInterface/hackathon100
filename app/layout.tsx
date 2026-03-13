import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IntelliTest – Generate manual & automated test cases',
  description: 'Enter application URL and business scenario to generate manual test cases (Excel) or Playwright tests. IntelliTest.',
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
