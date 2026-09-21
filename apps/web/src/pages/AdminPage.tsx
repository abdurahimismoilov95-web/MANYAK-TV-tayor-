import { useAuthStore } from '../store/authStore';

export default function AdminPage() {
  const { user } = useAuthStore();

  if (!user?.isAdmin) {
    return <div className="p-4">Access denied</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-gray-400">Total Users</p>
          <p className="text-3xl font-bold">1,234</p>
        </div>
        <div className="bg-gray-900 p-4 rounded-lg">
          <p className="text-gray-400">Total Content</p>
          <p className="text-3xl font-bold">567</p>
        </div>
      </div>
    </div>
  );
}
