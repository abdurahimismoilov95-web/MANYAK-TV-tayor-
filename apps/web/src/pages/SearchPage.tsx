import { useState } from 'react';
import { Search } from 'lucide-react';
import { useContentStore } from '../store/contentStore';
import ContentCard from '../components/ContentCard';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const { searchContents } = useContentStore();

  const handleSearch = async (q: string) => {
    setQuery(q);
    if (q.length > 2) {
      const data = await searchContents(q);
      setResults(data);
    }
  };

  return (
    <div className="p-4">
      <div className="sticky top-0 z-10 bg-black pb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-gray-400" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Kino yoki serial qidiring..."
            className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 rounded-lg"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 mt-4">
        {results.map((item) => (
          <ContentCard key={item.id} content={item} />
        ))}
      </div>
    </div>
  );
}
