'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { StatCard } from '@/components/StatCard';
import { PriceTrendChart } from '@/components/PriceTrendChart';

interface CityStats {
  name: string;
  summary: {
    avgPricePerSqm: number | null;
    avgDealAmount: number | null;
    dealCount: number;
  };
  priceHistory: Array<{ month: string; avgPricePerSqm: number; deals: number }>;
}

const COLORS = ['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'];
const CITY_OPTIONS = ['תל אביב', 'ירושלים', 'חיפה', 'באר שבע', 'נתניה'];

function ComparePage() {
  const searchParams = useSearchParams();
  const initialCity = searchParams.get('cities') || '';

  const [selected, setSelected] = useState<string[]>(
    initialCity ? [initialCity] : []
  );
  const [cityInput, setCityInput] = useState('');
  const [stats, setStats] = useState<CityStats[]>([]);
  const [loading, setLoading] = useState(false);

  async function fetchStats(cities: string[]) {
    if (!cities.length) return;
    setLoading(true);
    try {
      const results = await Promise.all(
        cities.map(async city => {
          const res = await fetch(`/api/stats?city=${encodeURIComponent(city)}`);
          if (!res.ok) throw new Error(`Failed for ${city}`);
          const data = await res.json();
          return { name: city, ...data } as CityStats;
        })
      );
      setStats(results);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selected.length > 0) fetchStats(selected);
  }, [selected]);

  function addCity(name: string) {
    const trimmed = name.trim();
    if (!trimmed || selected.includes(trimmed) || selected.length >= 4) return;
    setSelected(prev => [...prev, trimmed]);
    setCityInput('');
  }

  function removeCity(name: string) {
    setSelected(prev => prev.filter(c => c !== name));
    setStats(prev => prev.filter(s => s.name !== name));
  }

  // Merge histories for multi-line chart
  type HistoryEntry = Record<string, number | string>;
  const mergedHistory: HistoryEntry[] = (() => {
    const map = new Map<string, HistoryEntry>();
    for (const s of stats) {
      for (const p of s.priceHistory) {
        const entry = map.get(p.month) ?? { month: p.month };
        entry[s.name] = p.avgPricePerSqm;
        map.set(p.month, entry);
      }
    }
    return Array.from(map.values()).sort((a, b) =>
      String(a.month).localeCompare(String(b.month))
    );
  })();

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">השוואת אזורים</h1>
      <p className="text-gray-500 mb-8">השווה עד 4 ערים זו לצד זו</p>

      {/* City selector */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-8">
        <div className="flex flex-wrap gap-2 mb-4">
          {selected.map((city, i) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium text-white"
              style={{ backgroundColor: COLORS[i] }}
            >
              {city}
              <button
                onClick={() => removeCity(city)}
                className="hover:opacity-75 transition-opacity text-xs"
              >
                ✕
              </button>
            </span>
          ))}
          {selected.length === 0 && (
            <span className="text-sm text-gray-400">לא נבחרו ערים עדיין</span>
          )}
        </div>

        {selected.length < 4 && (
          <div className="flex gap-2 flex-wrap">
            <div className="flex gap-2">
              <input
                type="text"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addCity(cityInput); }}
                placeholder="שם עיר..."
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                dir="rtl"
              />
              <button
                onClick={() => addCity(cityInput)}
                className="bg-brand-600 text-white rounded-lg px-4 py-2 text-sm hover:bg-brand-700 transition-colors"
              >
                הוסף
              </button>
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {CITY_OPTIONS.filter(c => !selected.includes(c)).map(c => (
                <button
                  key={c}
                  onClick={() => addCity(c)}
                  className="text-xs border border-gray-200 rounded-full px-3 py-1.5 hover:bg-gray-50 hover:border-brand-300 transition-colors text-gray-600"
                >
                  + {c}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="text-center py-8 text-gray-400">טוען נתונים...</div>
      )}

      {stats.length > 0 && !loading && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((s, i) => (
              <div key={s.name} className="space-y-3">
                <h3
                  className="font-bold text-base pb-1 border-b-2"
                  style={{ borderColor: COLORS[i], color: COLORS[i] }}
                >
                  {s.name}
                </h3>
                <StatCard
                  label='מחיר ממוצע למ"ר'
                  value={s.summary.avgPricePerSqm}
                  unit="₪"
                />
                <StatCard
                  label="מחיר ממוצע לדירה"
                  value={s.summary.avgDealAmount}
                  unit="₪"
                />
                <StatCard
                  label="עסקאות (12 חודשים)"
                  value={s.summary.dealCount}
                />
              </div>
            ))}
          </div>

          {/* Combined price trend chart */}
          {mergedHistory.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-800 mb-4">
                מגמת מחיר למ"ר — השוואה
              </h2>
              {/* Multi-line recharts */}
              <MultiCityChart data={mergedHistory} cities={stats.map(s => s.name)} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MultiCityChart({
  data,
  cities,
}: {
  data: Record<string, string | number>[];
  cities: string[];
}) {
  const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } =
    require('recharts');

  function formatMonth(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
  }

  const formatted = data.map(d => ({ ...d, monthLabel: formatMonth(String(d.month)) }));

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={formatted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="monthLabel"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tickFormatter={(v: number) => `₪${(v / 1000).toFixed(0)}K`}
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value: number, name: string) => [`₪${value.toLocaleString('he-IL')}`, name]}
          contentStyle={{ fontFamily: 'inherit', fontSize: 13 }}
        />
        <Legend />
        {cities.map((city, i) => (
          <Line
            key={city}
            type="monotone"
            dataKey={city}
            stroke={['#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6'][i]}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function ComparePageWrapper() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-gray-400">טוען...</div>}>
      <ComparePage />
    </Suspense>
  );
}
