import { MortgageCalculator } from '@/components/MortgageCalculator';

export const metadata = {
  title: 'מחשבון משכנתא — נדל"ן ישראל',
  description: 'חשב החזר חודשי, LTV וסה"כ עלות משכנתא בישראל',
};

export default function MortgagePage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">מחשבון משכנתא</h1>
      <p className="text-gray-500 mb-8">
        חשב את ההחזר החודשי, סה"כ עלות ויחס ה-LTV.
      </p>

      <MortgageCalculator />

      {/* Info */}
      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h2 className="font-bold text-blue-900 mb-3">מה זה LTV?</h2>
        <p className="text-sm text-blue-800 mb-3">
          <strong>LTV (Loan-to-Value)</strong> = (סכום הלוואה ÷ שווי נכס) × 100.
          בנק ישראל מגביל את ה-LTV:
        </p>
        <ul className="space-y-1.5 text-sm text-blue-800">
          <li>• דירה ראשונה: עד <strong>75%</strong> LTV</li>
          <li>• דירה חליפית (מכירה + קנייה): עד <strong>70%</strong> LTV</li>
          <li>• משקיע (דירה להשקעה): עד <strong>50%</strong> LTV</li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">
          * כללי בנק ישראל עשויים להשתנות. בדוק מול הבנק שלך.
        </p>
      </div>

      <div className="mt-6 bg-amber-50 rounded-xl border border-amber-200 p-5">
        <h3 className="font-bold text-amber-900 mb-1">ריבית עדכנית</h3>
        <p className="text-sm text-amber-800">
          ריבית בנק ישראל מתעדכנת כל 6 שבועות. לריבית העדכנית:{' '}
          <a
            href="https://www.boi.org.il"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:no-underline"
          >
            boi.org.il
          </a>
        </p>
      </div>
    </div>
  );
}
