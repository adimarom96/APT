import { YieldCalculator } from '@/components/YieldCalculator';
import { calcPurchaseTax, formatILS } from '@/lib/tax';

export const metadata = {
  title: 'מחשבון תשואה — נדל"ן ישראל',
  description: 'חשב תשואה גולמית, נטו ושנות פירעון על השקעת נדל"ן בישראל',
};

export default function YieldPage() {
  // Example purchase tax calculation for display
  const examplePrice = 2_000_000;
  const investorTax = calcPurchaseTax(examplePrice, false);
  const firstHomeTax = calcPurchaseTax(examplePrice, true);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">מחשבון תשואה</h1>
      <p className="text-gray-500 mb-8">
        חשב תשואה גולמית ונטו על השקעת נדל"ן, ובדוק מתי ההשקעה תחזיר את עצמה.
      </p>

      <YieldCalculator />

      {/* Explanation */}
      <div className="mt-8 bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h2 className="font-bold text-blue-900 mb-3">מה ההבדל בין תשואה גולמית לנטו?</h2>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>
            <strong>תשואה גולמית</strong> = (שכר דירה שנתי ÷ מחיר הנכס) × 100
          </li>
          <li>
            <strong>תשואה נטו</strong> = ((שכר דירה שנתי − הוצאות שנתיות) ÷ מחיר הנכס) × 100
          </li>
          <li>
            <strong>שנות פירעון</strong> = מחיר הנכס ÷ הכנסה נטו שנתית
          </li>
        </ul>
        <p className="text-xs text-blue-600 mt-3">
          * לחישוב מדויק יותר: כלול מס הכנסה על שכ"ד, פחת נכס, ועלויות עסקה (מס רכישה, עו"ד, תיווך).
        </p>
      </div>

      {/* Purchase tax calculator */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="font-bold text-gray-900 mb-4">מס רכישה (לדוגמה — ₪2,000,000)</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-1">למשקיע (לא דירה ראשונה)</p>
            <p className="text-xl font-bold text-gray-900">{formatILS(investorTax.purchaseTax)}</p>
            <p className="text-xs text-gray-500">שיעור אפקטיבי: {investorTax.effectiveRate}%</p>
          </div>
          <div className="border border-gray-100 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-1">לרוכש דירה ראשונה</p>
            <p className="text-xl font-bold text-gray-900">{formatILS(firstHomeTax.purchaseTax)}</p>
            <p className="text-xs text-gray-500">שיעור אפקטיבי: {firstHomeTax.effectiveRate}%</p>
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          * מדרגות מס רכישה נכון ל-2024. בדוק באתר רשות המסים לפני ביצוע עסקה.
        </p>
      </div>
    </div>
  );
}
