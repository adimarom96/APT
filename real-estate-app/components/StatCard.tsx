'use client';

interface StatCardProps {
  label: string;
  value: string | number | null;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({ label, value, unit, trend, trendValue, className = '' }: StatCardProps) {
  const trendColor =
    trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-500' : 'text-gray-500';
  const trendIcon = trend === 'up' ? '↑' : trend === 'down' ? '↓' : '';

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 shadow-sm ${className}`}>
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-1.5">
        {value !== null && value !== undefined ? (
          <>
            <span className="text-2xl font-bold text-gray-900">
              {typeof value === 'number' ? value.toLocaleString('he-IL') : value}
            </span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </>
        ) : (
          <span className="text-2xl font-bold text-gray-300">—</span>
        )}
      </div>
      {trendValue && (
        <p className={`text-sm mt-1 ${trendColor}`}>
          {trendIcon} {trendValue}
        </p>
      )}
    </div>
  );
}
