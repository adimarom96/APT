'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PricePoint {
  month: string;
  avgPricePerSqm: number;
  deals?: number;
}

interface PriceTrendChartProps {
  data: PricePoint[];
  title?: string;
  color?: string;
  cityName?: string;
}

function formatMonth(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('he-IL', { month: 'short', year: '2-digit' });
}

function formatILS(value: number): string {
  return `₪${value.toLocaleString('he-IL')}`;
}

export function PriceTrendChart({
  data,
  title,
  color = '#0ea5e9',
  cityName,
}: PriceTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        אין נתונים להצגה
      </div>
    );
  }

  const formatted = data.map(d => ({
    ...d,
    monthLabel: formatMonth(d.month),
  }));

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-sm font-medium text-gray-600 mb-3">{title}</h3>
      )}
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={formatted} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="monthLabel"
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={v => `₪${(v / 1000).toFixed(0)}K`}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            tickLine={false}
            axisLine={false}
            width={55}
          />
          <Tooltip
            formatter={(value: number) => [formatILS(value), `מחיר/מ"ר`]}
            labelFormatter={label => `חודש: ${label}`}
            contentStyle={{ fontFamily: 'inherit', fontSize: 13 }}
          />
          <Line
            type="monotone"
            dataKey="avgPricePerSqm"
            stroke={color}
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 5 }}
            name={cityName || `מחיר ממוצע למ"ר`}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
