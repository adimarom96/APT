import { CitySearchBar } from '@/components/CitySearchBar';
import { StatCard } from '@/components/StatCard';
import Link from 'next/link';
import { prisma } from '@/lib/db';

async function getFeaturedCities() {
  try {
    const since12Months = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const cities = await prisma.deal.groupBy({
      by: ['cityName'],
      _count: { id: true },
      _avg: { pricePerSqm: true },
      where: {
        cityName: { not: null },
        dealDate: { gte: since12Months },
        pricePerSqm: { gt: 0 },
      },
      orderBy: { _count: { id: 'desc' } },
      take: 6,
    });
    return cities.filter(c => c.cityName).map(c => ({
      name: c.cityName!,
      dealCount: c._count.id,
      avgPricePerSqm: c._avg.pricePerSqm ? Math.round(Number(c._avg.pricePerSqm)) : null,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const cities = await getFeaturedCities();

  return (
    <div>
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-4 leading-tight">
          השקעות נדל"ן בישראל —<br />
          <span className="text-brand-600">נתונים, לא ניחושים</span>
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto">
          נתוני עסקאות אמיתיים מרשות המסים. חשב תשואה, משכנתא, ומס רכישה בשניות.
        </p>
        <div className="flex justify-center">
          <CitySearchBar />
        </div>
      </section>

      {/* Quick links */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
        <Link
          href="/calculator/yield"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group"
        >
          <div className="text-3xl mb-2">📈</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-700">מחשבון תשואה</h3>
          <p className="text-sm text-gray-500 mt-1">תשואה גולמית, נטו ושנות פירעון</p>
        </Link>
        <Link
          href="/calculator/mortgage"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group"
        >
          <div className="text-3xl mb-2">🏦</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-700">מחשבון משכנתא</h3>
          <p className="text-sm text-gray-500 mt-1">החזר חודשי, LTV וסה"כ עלות</p>
        </Link>
        <Link
          href="/compare"
          className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md hover:border-brand-300 transition-all group"
        >
          <div className="text-3xl mb-2">⚖️</div>
          <h3 className="font-bold text-gray-900 group-hover:text-brand-700">השוואת אזורים</h3>
          <p className="text-sm text-gray-500 mt-1">השווה עד 4 ערים זו לצד זו</p>
        </Link>
      </section>

      {/* Featured cities */}
      {cities.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-5">ערים מובילות</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {cities.map(city => (
              <Link key={city.name} href={`/city/${encodeURIComponent(city.name)}`}>
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md hover:border-brand-300 transition-all text-center cursor-pointer">
                  <p className="font-bold text-gray-900 mb-1">{city.name}</p>
                  {city.avgPricePerSqm && (
                    <p className="text-brand-600 font-semibold text-sm">
                      ₪{city.avgPricePerSqm.toLocaleString('he-IL')}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-0.5">
                    {city.dealCount.toLocaleString('he-IL')} עסקאות
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {cities.length === 0 && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
          <p className="text-yellow-800 font-medium mb-2">אין נתונים במסד הנתונים עדיין</p>
          <p className="text-yellow-700 text-sm">
            הרץ את הסורק כדי לאכלס את הנתונים:{' '}
            <code className="bg-yellow-100 px-1 rounded">cd nadlan-crawler && node crawler.js</code>
          </p>
        </section>
      )}
    </div>
  );
}
