import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { adminMenuItems } from '../components/Sidebar';

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar items={adminMenuItems} basePath="/admin" collapsed={collapsed} setCollapsed={setCollapsed} />
      <main className={`transition-all ${collapsed ? 'ml-16' : 'ml-60'}`}>
        <Outlet />
      </main>
    </div>
  );
}
