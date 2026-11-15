import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../lib/axios';
import Skeleton from '../../components/ui/Skeleton';

export default function AdminDashboard() {
  const { t } = useTranslation();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => api.get('/admin/dashboard').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="font-heading font-black text-3xl">{t('admin.dashboard')}</h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  const statCards = [
    { label: t('admin.todayOrders'), value: data?.todayOrders ?? 0, icon: '📦' },
    { label: t('admin.totalSales'), value: `${(data?.totalSales ?? 0).toFixed(2)} TND`, icon: '💰' },
    { label: t('admin.pendingOrders'), value: data?.pendingOrders ?? 0, icon: '⏳' },
    { label: t('admin.newMessages'), value: data?.newMessages ?? 0, icon: '💬' },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="font-heading font-black text-3xl">{t('admin.dashboard')}</h1>
          <p className="text-gray-500 text-sm">Vue d'ensemble de l'activité de LOCO Arts</p>
        </div>
        <Link to="/admin/produits/nouveau" className="btn-primary text-xs tracking-wider">
          + {t('admin.addProduct')}
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <div key={i} className="border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between text-2xl mb-2">
              <span>{card.icon}</span>
            </div>
            <div className="text-xs uppercase font-heading text-gray-500 font-semibold tracking-wide">
              {card.label}
            </div>
            <div className="text-2xl font-heading font-black mt-1">
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Chart 7 Days */}
      <div className="border border-gray-200 bg-white p-6">
        <h2 className="font-heading font-bold text-lg mb-6">Ventes des 7 derniers jours (TND)</h2>
        <div className="h-72 w-full">
          {data?.salesChart && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.salesChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888" fontSize={11} tickLine={false} />
                <Tooltip
                  formatter={(val) => [`${val} TND`, 'Revenu']}
                  contentStyle={{ backgroundColor: '#000', color: '#fff', borderRadius: '0px', border: 'none' }}
                />
                <Bar dataKey="revenue" fill="#000" radius={[0, 0, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Tables: Low Stock & Best Sellers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="border border-gray-200 bg-white p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-base uppercase tracking-wide">
              ⚠️ Alertes stock faible
            </h2>
            <Link to="/admin/produits" className="text-xs underline font-heading font-bold">Gérer</Link>
          </div>
          {data?.lowStock?.length > 0 ? (
            <div className="divide-y divide-gray-100 text-sm">
              {data.lowStock.map((v) => (
                <div key={v.id} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{v.product?.name}</p>
                    <p className="text-xs text-gray-500">Taille: {v.size} {v.color && `· ${v.color}`}</p>
                  </div>
                  <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 text-xs">
                    {v.stock} restant(s)
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4">Tous les stocks sont normaux.</p>
          )}
        </div>

        {/* Best sellers */}
        <div className="border border-gray-200 bg-white p-6">
          <h2 className="font-heading font-bold text-base uppercase tracking-wide mb-4">
            🏆 Meilleures ventes
          </h2>
          {data?.bestSellers?.length > 0 ? (
            <div className="divide-y divide-gray-100 text-sm">
              {data.bestSellers.map((prod, i) => (
                <div key={i} className="py-2.5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{prod.name}</p>
                    <p className="text-xs text-gray-500">{prod.price} TND</p>
                  </div>
                  <span className="font-bold bg-black text-white px-2 py-0.5 text-xs">
                    {prod.totalSold} vendus
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm py-4">Pas encore assez de données de vente.</p>
          )}
        </div>
      </div>
    </div>
  );
}
