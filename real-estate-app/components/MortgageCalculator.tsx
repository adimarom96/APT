'use client';

import { useState } from 'react';
import { calcMortgage } from '@/lib/mortgage';

export function MortgageCalculator() {
  const [price, setPrice] = useState(2_000_000);
  const [equity, setEquity] = useState(500_000);
  const [rate, setRate] = useState(5.5);
  const [years, setYears] = useState(25);

  const valid = equity >= 0 && equity < price && price > 0 && rate > 0 && years > 0;
  const result = valid ? calcMortgage({ price, equity, annualRate: rate, years }) : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-5">מחשבון משכנתא</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מחיר נכס (₪)
          </label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={50000}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            הון עצמי (₪)
          </label>
          <input
            type="number"
            value={equity}
            onChange={e => setEquity(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={50000}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            ריבית שנתית (%)
          </label>
          <input
            type="number"
            value={rate}
            onChange={e => setRate(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={0.1}
            min={0.1}
            max={20}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            תקופה (שנים)
          </label>
          <input
            type="number"
            value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={1}
            min={5}
            max={30}
          />
        </div>
      </div>

      {result ? (
        <div className="border-t border-gray-100 pt-5">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-brand-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">החזר חודשי</p>
              <p className="text-2xl font-bold text-brand-700">
                ₪{result.monthlyPayment.toLocaleString('he-IL')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-xs text-gray-500 mb-1">סה"כ עלות</p>
              <p className="text-xl font-bold text-gray-800">
                ₪{result.totalCost.toLocaleString('he-IL')}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">קרן</p>
              <p className="font-semibold text-gray-700">
                ₪{result.principal.toLocaleString('he-IL')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">סה"כ ריבית</p>
              <p className="font-semibold text-gray-700">
                ₪{result.totalInterest.toLocaleString('he-IL')}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">LTV</p>
              <p className="font-semibold text-gray-700">{result.ltv}%</p>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-red-500 text-center">
          אנא בדוק את הערכים שהוזנו
        </p>
      )}

      <p className="text-xs text-gray-400 mt-4">
        * חישוב בריבית קבועה (שפיצר). ריבית בנק ישראל עשויה להשתנות.
      </p>
    </div>
  );
}
