import { Link } from 'react-router-dom';
import { Play, Crown } from 'lucide-react';

interface Props {
  content: any;
}

export default function ContentCard({ content }: Props) {
  return (
    <Link to={`/content/${content.id}`} className="group">
      <div className="relative rounded-lg overflow-hidden bg-gray-900">
        <img
          src={content.thumbnailUrl || '/placeholder.jpg'}
          alt={content.title}
          className="w-full aspect-[2/3] object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-2">
          <h3 className="font-semibold text-sm line-clamp-2">{content.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            {content.isPremium && <Crown size={12} className="text-yellow-500" />}
            <Play size={12} className="text-red-500" />
          </div>
        </div>
      </div>
    </Link>
  );
}
