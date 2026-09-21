import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, Heart } from 'lucide-react';
import { api } from '../lib/api';

export default function ContentPage() {
  const { id } = useParams();
  const [content, setContent] = useState<any>(null);

  useEffect(() => {
    api.get(`/content/${id}`).then((res) => setContent(res.data));
  }, [id]);

  if (!content) return <div className="p-4">Loading...</div>;

  return (
    <div>
      <div className="relative h-[50vh]">
        <img
          src={content.thumbnailUrl}
          alt={content.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
      </div>
      <div className="p-6 space-y-4">
        <h1 className="text-3xl font-bold">{content.title}</h1>
        <p className="text-gray-300">{content.description}</p>
        <div className="flex gap-4">
          <Link
            to={`/player/${content.id}`}
            className="flex items-center gap-2 bg-red-600 px-6 py-3 rounded-lg"
          >
            <Play size={20} /> Play
          </Link>
          <button className="flex items-center gap-2 bg-gray-800 px-6 py-3 rounded-lg">
            <Heart size={20} /> Like
          </button>
        </div>
      </div>
    </div>
  );
}
