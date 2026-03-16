import Link from 'next/link';

export default function CityNotFound() {
  return (
    <div className="text-center py-20">
      <p className="text-5xl mb-4">🏘️</p>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">עיר לא נמצאה</h2>
      <p className="text-gray-500 mb-6">
        לא נמצאו נתונים עבור עיר זו. ייתכן שהשם שגוי או שהנתונים עדיין לא הוטענו.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 bg-brand-600 text-white rounded-lg px-5 py-2.5 hover:bg-brand-700 transition-colors"
      >
        ← חזרה לדף הבית
      </Link>
    </div>
  );
}
