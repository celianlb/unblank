import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import './globals.css';

const heebo = Heebo({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  variable: '--font-heebo',
});

export const metadata: Metadata = {
  title: 'UnBlank - Transformez vos moments de procrastination',
  description: 'UnBlank vous aide à transformer vos moments de procrastination en opportunités créatives',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={heebo.variable}>{children}</body>
    </html>
  );
}
