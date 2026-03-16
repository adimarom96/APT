'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface City {
  name: string;
  dealCount: number;
  avgPricePerSqm: number | null;
}

export function CitySearchBar() {
  const [query, setQuery] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [filtered, setFiltered] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/cities')
      .then(r => r.json())
      .then(data => setCities(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 1) {
      setFiltered([]);
      setOpen(false);
      return;
    }
    const q = query.toLowerCase();
    const matches = cities.filter(c => c.name.includes(q)).slice(0, 8);
    setFiltered(matches);
    setOpen(matches.length > 0);
  }, [query, cities]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handleSelect(city: City) {
    setQuery(city.name);
    setOpen(false);
    router.push(`/city/${encodeURIComponent(city.name)}`);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/city/${encodeURIComponent(query.trim())}`);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative w-full max-w-lg">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="חפש עיר — תל אביב, ירושלים, חיפה..."
            className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3.5 pr-12 text-gray-900 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-base"
            dir="rtl"
          />
          <button
            type="submit"
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600 transition-colors"
          >
            🔍
          </button>
        </div>
      </form>

      {open && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden">
          {filtered.map(city => (
            <li key={city.name}>
              <button
                className="w-full flex items-center justify-between px-5 py-3 text-right hover:bg-brand-50 transition-colors"
                onClick={() => handleSelect(city)}
              >
                <span className="text-gray-800 font-medium">{city.name}</span>
                <span className="text-xs text-gray-400">
                  {city.dealCount.toLocaleString('he-IL')} עסקאות
                  {city.avgPricePerSqm
                    ? ` · ₪${city.avgPricePerSqm.toLocaleString('he-IL')}/מ"ר`
                    : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
