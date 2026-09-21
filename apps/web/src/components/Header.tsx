import { Film } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-sm border-b border-gray-800">
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Film className="text-red-500" size={24} />
          <span className="text-xl font-bold">MANYAK TV</span>
        </div>
      </div>
    </header>
  );
}
