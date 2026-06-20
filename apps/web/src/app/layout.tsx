import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/Header';

export const metadata: Metadata = {
  title: 'FoodSave — Save food, save money',
  description:
    'FoodSave helps restaurants, cafes and bakeries sell surplus food at 50–70% off, cutting waste and feeding people for less.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
          <footer className="mt-12 border-t bg-white py-6 text-center text-sm text-slate-400">
            FoodSave — fighting food waste in Kazakhstan 🇰🇿
          </footer>
        </Providers>
      </body>
    </html>
  );
}
