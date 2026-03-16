import type { Metadata } from 'next';
import { Heebo } from 'next/font/google';
import Link from 'next/link';
import { Chatbot } from '@/components/Chatbot';
import './globals.css';

const heebo = Heebo({
  subsets: ['hebrew', 'latin'],
  variable: '--font-heebo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'נדל"ן ישראל — פלטפורמת השקעות נדל"ן',
  description: 'כלי חינמי למשקיעי נדל"ן בישראל — נתוני מחירים, תשואה, משכנתא והשוואת אזורים',
  keywords: 'נדלן, השקעות נדלן, מחירי דירות, תשואה, משכנתא, ישראל',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body>
        <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-xl font-bold text-brand-700">
                🏠 נדל"ן ישראל
              </Link>
              <div className="flex items-center gap-6 text-sm font-medium text-gray-600">
                <Link href="/compare" className="hover:text-brand-600 transition-colors">
                  השוואת אזורים
                </Link>
                <Link href="/calculator/yield" className="hover:text-brand-600 transition-colors">
                  מחשבון תשואה
                </Link>
                <Link href="/calculator/mortgage" className="hover:text-brand-600 transition-colors">
                  מחשבון משכנתא
                </Link>
              </div>
            </div>
          </div>
        </nav>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>

        <Chatbot />

        <footer className="border-t border-gray-200 mt-16 py-8 text-center text-sm text-gray-400">
          <p>
            הנתונים מבוססים על עסקאות שדווחו לרשות המסים בישראל (נדל"ן.gov.il).
            <br />
            המידע לצרכי למידה בלבד ואינו מהווה ייעוץ השקעות.
          </p>
        </footer>
      </body>
    </html>
  );
}
