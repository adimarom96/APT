'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface RoomData {
  rooms: number;
  deals: number;
  avgPrice: number;
  avgPricePerSqm: number;
}

interface RoomDistributionChartProps {
  data: RoomData[];
  metric?: 'avgPrice' | 'avgPricePerSqm' | 'deals';
}

const ROOM_LABELS: Record<number, string> = {
  1: '1 חד׳',
  1.5: '1.5 חד׳',
  2: '2 חד׳',
  2.5: '2.5 חד׳',
  3: '3 חד׳',
  3.5: '3.5 חד׳',
  4: '4 חד׳',
  4.5: '4.5 חד׳',
  5: '5 חד׳',
  5.5: '5.5 חד׳',
  6: '6+ חד׳',
};

const COLORS = ['#bae6fd', '#7dd3fc', '#38bdf8', '#0ea5e9', '#0284c7', '#0369a1'];

export function RoomDistributionChart({
  data,
  metric = 'avgPricePerSqm',
}: RoomDistributionChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        אין נתונים להצגה
      </div>
    );
  }

  const metricLabel =
    metric === 'avgPrice'
      ? 'מחיר ממוצע (₪)'
      : metric === 'avgPricePerSqm'
      ? 'מחיר ממוצע למ"ר (₪)'
      : 'מספר עסקאות';

  const formatted = data.map(d => ({
    ...d,
    label: ROOM_LABELS[d.rooms] || `${d.rooms} חד׳`,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={formatted} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12, fill: '#6b7280' }}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v =>
            metric === 'deals'
              ? v.toLocaleString('he-IL')
              : `₪${(v / 1000).toFixed(0)}K`
          }
          tick={{ fontSize: 11, fill: '#6b7280' }}
          tickLine={false}
          axisLine={false}
          width={55}
        />
        <Tooltip
          formatter={(value: number) => [
            metric === 'deals'
              ? value.toLocaleString('he-IL')
              : `₪${value.toLocaleString('he-IL')}`,
            metricLabel,
          ]}
          contentStyle={{ fontFamily: 'inherit', fontSize: 13 }}
        />
        <Bar dataKey={metric} radius={[4, 4, 0, 0]}>
          {formatted.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
