import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function HeroSlider({ items }: { items: any[] }) {
  if (!items.length) return null;
  const featured = items[0];

  return (
    <div className="relative h-[60vh] overflow-hidden">
      <img
        src={featured.thumbnailUrl}
        alt={featured.title}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <h1 className="text-3xl font-bold mb-2">{featured.title}</h1>
        <p className="text-gray-300 mb-4 line-clamp-2">{featured.description}</p>
        <Link
          to={`/player/${featured.id}`}
          className="inline-flex items-center gap-2 bg-red-600 px-6 py-3 rounded-lg font-semibold"
        >
          <Play size={20} /> Tomosha qilish
        </Link>
      </div>
    </div>
  );
}
