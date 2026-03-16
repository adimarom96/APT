'use client';

import { useState } from 'react';

interface Deal {
  id: number;
  fullAddress: string | null;
  rooms: number | null;
  floor: number | null;
  buildingFloors: number | null;
  areaSqm: number | null;
  dealAmount: string | null;
  pricePerSqm: number | null;
  dealDate: string | null;
  assetType: string | null;
  isNewProject: boolean | null;
}

interface DealsTableProps {
  deals: Deal[];
  isLoading?: boolean;
}

type SortKey = 'dealDate' | 'dealAmount' | 'pricePerSqm' | 'rooms' | 'areaSqm';
type SortDir = 'asc' | 'desc';

function formatILS(val: string | number | null): string {
  if (val === null || val === undefined) return '—';
  const n = typeof val === 'string' ? parseInt(val) : val;
  if (isNaN(n)) return '—';
  return `₪${n.toLocaleString('he-IL')}`;
}

export function DealsTable({ deals, isLoading }: DealsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('dealDate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  }

  const sorted = [...deals].sort((a, b) => {
    let av: number | string | null = null;
    let bv: number | string | null = null;
    if (sortKey === 'dealDate') { av = a.dealDate; bv = b.dealDate; }
    if (sortKey === 'dealAmount') { av = a.dealAmount ? parseInt(a.dealAmount) : null; bv = b.dealAmount ? parseInt(b.dealAmount) : null; }
    if (sortKey === 'pricePerSqm') { av = a.pricePerSqm; bv = b.pricePerSqm; }
    if (sortKey === 'rooms') { av = a.rooms; bv = b.rooms; }
    if (sortKey === 'areaSqm') { av = a.areaSqm; bv = b.areaSqm; }

    if (av === null) return 1;
    if (bv === null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <span className="text-gray-300 mr-1">↕</span>;
    return <span className="text-brand-600 mr-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  }

  function Th({ label, k }: { label: string; k: SortKey }) {
    return (
      <th
        className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none"
        onClick={() => handleSort(k)}
      >
        <SortIcon k={k} />
        {label}
      </th>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        טוען נתונים...
      </div>
    );
  }

  if (!deals.length) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        לא נמצאו עסקאות
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              כתובת
            </th>
            <Th label="חד׳" k="rooms" />
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              קומה
            </th>
            <Th label='מ"ר' k="areaSqm" />
            <Th label="מחיר" k="dealAmount" />
            <Th label='₪/מ"ר' k="pricePerSqm" />
            <Th label="תאריך" k="dealDate" />
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {sorted.map(deal => (
            <tr key={deal.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-3 text-gray-800 max-w-xs truncate">
                {deal.fullAddress || '—'}
                {deal.isNewProject && (
                  <span className="mr-2 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                    חדש
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-gray-700 text-center">
                {deal.rooms ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-600 text-center">
                {deal.floor !== null
                  ? `${deal.floor}${deal.buildingFloors ? `/${deal.buildingFloors}` : ''}`
                  : '—'}
              </td>
              <td className="px-4 py-3 text-gray-700 text-center">
                {deal.areaSqm ?? '—'}
              </td>
              <td className="px-4 py-3 font-medium text-gray-900">
                {formatILS(deal.dealAmount)}
              </td>
              <td className="px-4 py-3 text-brand-700 font-medium">
                {deal.pricePerSqm ? `₪${deal.pricePerSqm.toLocaleString('he-IL')}` : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                {deal.dealDate
                  ? new Date(deal.dealDate).toLocaleDateString('he-IL')
                  : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
