import { Home, Search, User } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function BottomNav() {
  const location = useLocation();

  const links = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 z-50">
      <div className="flex justify-around items-center h-16">
        {links.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`flex flex-col items-center justify-center w-full h-full ${
              location.pathname === path ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            <Icon size={24} />
            <span className="text-xs mt-1">{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
