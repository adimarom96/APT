'use client';

import { useState } from 'react';
import { calcYield } from '@/lib/yield';

interface YieldCalculatorProps {
  defaultPrice?: number;
}

export function YieldCalculator({ defaultPrice }: YieldCalculatorProps) {
  const [price, setPrice] = useState(defaultPrice ?? 1_500_000);
  const [rent, setRent] = useState(5_500);
  const [expenses, setExpenses] = useState(500);

  const result = calcYield({ purchasePrice: price, monthlyRent: rent, monthlyExpenses: expenses });

  const yieldColor =
    result.grossYield >= 5 ? 'text-green-600' : result.grossYield >= 3 ? 'text-yellow-600' : 'text-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-5">מחשבון תשואה</h3>

      <div className="grid grid-cols-1 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            מחיר רכישה (₪)
          </label>
          <input
            type="number"
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={50000}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            שכר דירה חודשי (₪)
          </label>
          <input
            type="number"
            value={rent}
            onChange={e => setRent(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={100}
            min={0}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            הוצאות חודשיות (₪) — ועד בית, ביטוח, תחזוקה
          </label>
          <input
            type="number"
            value={expenses}
            onChange={e => setExpenses(Number(e.target.value))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
            step={50}
            min={0}
          />
        </div>
      </div>

      <div className="border-t border-gray-100 pt-5 grid grid-cols-3 gap-4">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">תשואה גולמית</p>
          <p className={`text-2xl font-bold ${yieldColor}`}>
            {result.grossYield.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">תשואה נטו</p>
          <p className="text-2xl font-bold text-gray-800">
            {result.netYield.toFixed(2)}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">שנות פירעון</p>
          <p className="text-2xl font-bold text-gray-800">
            {isFinite(result.breakEvenYears) ? result.breakEvenYears.toFixed(1) : '∞'}
          </p>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-4">
        * אינו כולל מס הכנסה על שכר דירה, פחת, ועלויות עסקה.
      </p>
    </div>
  );
}
