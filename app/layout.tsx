import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'CPC Prep - Medical Coding Exam Study',
  description: 'Flash card study app for CPC (Certified Professional Coder) exam preparation',
};

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-white/80 hover:text-white font-medium transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
    >
      {children}
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-bg text-text">
        <nav className="bg-primary shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
            <Link href="/" className="text-white text-xl font-bold tracking-tight flex items-center gap-2">
              <span className="text-2xl">🏥</span> CPC Prep
            </Link>
            <div className="flex items-center gap-1">
              <NavLink href="/study">Study</NavLink>
              <NavLink href="/quiz">Quiz</NavLink>
              <NavLink href="/progress">Progress</NavLink>
            </div>
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-6">
          {children}
        </main>
      </body>
    </html>
  );
}
