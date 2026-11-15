import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];

export default function AdminOrders() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status, search, page],
    queryFn: () => api.get('/admin/orders', {
      params: { status: status || undefined, search: search || undefined, page, limit: 15 },
    }).then(r => r.data),
  });

  const handleExportCSV = () => {
    window.open('/api/admin/orders/export/csv', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl">{t('admin.orders')}</h1>
          <p className="text-gray-500 text-sm">Gestion et suivi de toutes les commandes</p>
        </div>
        <button onClick={handleExportCSV} className="btn-secondary text-xs tracking-wider">
          📥 {t('admin.exportCSV')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 bg-white p-4 border border-gray-200">
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou N°..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black flex-1 min-w-[200px]"
        />
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
        >
          <option value="">Tous les statuts</option>
          {STATUSES.map(st => (
            <option key={st} value={st}>{t(`status.${st}`)}</option>
          ))}
        </select>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data?.orders?.length > 0 ? (
        <div className="border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase font-heading text-xs text-gray-500">
              <tr>
                <th className="p-4">N° Commande</th>
                <th className="p-4">Client</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Gouvernorat</th>
                <th className="p-4">Total</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.orders.map((o) => {
                const name = o.guestName || o.user?.name || 'Client invité';
                const phone = o.guestPhone || o.user?.phone || o.address?.phone || '-';
                return (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono font-bold text-xs">{o.orderNumber}</td>
                    <td className="p-4 font-semibold">{name}</td>
                    <td className="p-4 text-gray-600">{phone}</td>
                    <td className="p-4 text-gray-600">{o.address?.governorate || '-'}</td>
                    <td className="p-4 font-bold">{o.total.toFixed(2)} TND</td>
                    <td className="p-4">
                      <Badge variant={o.status}>{t(`status.${o.status}`)}</Badge>
                    </td>
                    <td className="p-4 text-gray-500 text-xs">{new Date(o.createdAt).toLocaleDateString('fr-TN')}</td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/admin/commandes/${o.id}`}
                        className="btn-primary text-[10px] px-3 py-1.5 inline-block"
                      >
                        Gérer
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 bg-white text-gray-500">
          {t('admin.noOrders')}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination?.pages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
          {Array.from({ length: data.pagination.pages }, (_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`w-8 h-8 text-xs font-heading font-bold ${
                page === i + 1 ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-100'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
