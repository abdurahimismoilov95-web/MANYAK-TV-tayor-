import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import ContentPage from './pages/ContentPage';
import PlayerPage from './pages/PlayerPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import BottomNav from './components/BottomNav';
import { useAuthStore } from './store/authStore';

function App() {
  const { initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-black text-white pb-16">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/content/:id" element={<ContentPage />} />
          <Route path="/player/:id" element={<PlayerPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
