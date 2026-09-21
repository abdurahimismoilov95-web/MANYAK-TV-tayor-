import { useAuthStore } from '../store/authStore';
import { Crown, LogOut } from 'lucide-react';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Profil</h1>
      {user ? (
        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <div>
            <p className="text-gray-400">Ism</p>
            <p className="text-lg">{user.firstName || 'User'}</p>
          </div>
          {user.isVip && (
            <div className="flex items-center gap-2 text-yellow-500">
              <Crown size={20} />
              <span>VIP Status</span>
            </div>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-2 text-red-500 mt-4"
          >
            <LogOut size={20} />
            Chiqish
          </button>
        </div>
      ) : (
        <p>Iltimos, login qiling</p>
      )}
    </div>
  );
}
