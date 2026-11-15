import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import api from '../../lib/axios';

const navItems = [
  { path: '/admin', label: 'dashboard', icon: '📊' },
  { path: '/admin/commandes', label: 'orders', icon: '📦' },
  { path: '/admin/produits', label: 'products', icon: '👟' },
  { path: '/admin/categories', label: 'categories', icon: '📁' },
  { path: '/admin/clients', label: 'customers', icon: '👥' },
  { path: '/admin/messages', label: 'messages', icon: '💬' },
  { path: '/admin/parametres', label: 'settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { data: dashboard } = useQuery({
    queryKey: ['admin-dashboard-counts'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
    refetchInterval: 30000,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-800">
            <Link to="/" className="font-heading font-black text-xl tracking-tight">LOCO <span className="font-light italic">arts</span></Link>
            <p className="text-gray-500 text-xs mt-1">Administration</p>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/admin'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-4 py-3 text-sm font-medium transition-colors ${
                    isActive ? 'bg-white text-black' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{t(`admin.${item.label}`)}</span>
                {item.label === 'orders' && dashboard?.pendingOrders > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold">{dashboard.pendingOrders}</span>
                )}
                {item.label === 'messages' && dashboard?.newMessages > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 flex items-center justify-center font-bold">{dashboard.newMessages}</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <Link to="/" className="block text-gray-400 hover:text-white text-sm mb-3 transition-colors">← {t('admin.backToStore')}</Link>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 truncate">{user?.name}</span>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 text-sm">{t('nav.logout')}</button>
            </div>
          </div>
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(true)} className="p-2 mr-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-heading font-bold">Administration</span>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
