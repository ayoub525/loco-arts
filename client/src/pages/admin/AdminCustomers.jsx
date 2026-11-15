import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import Skeleton from '../../components/ui/Skeleton';

export default function AdminCustomers() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-customers', search, page],
    queryFn: () => api.get('/admin/customers', {
      params: { search: search || undefined, page, limit: 15 },
    }).then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading font-black text-3xl">{t('admin.customers')}</h1>
        <p className="text-gray-500 text-sm">Liste des clients enregistrés et historique de dépenses</p>
      </div>

      <div className="bg-white p-4 border border-gray-200">
        <input
          type="text"
          placeholder="Rechercher par nom, email ou téléphone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data?.customers?.length > 0 ? (
        <div className="border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase font-heading text-xs text-gray-500">
              <tr>
                <th className="p-4">Nom</th>
                <th className="p-4">Email</th>
                <th className="p-4">Téléphone</th>
                <th className="p-4">Commandes</th>
                <th className="p-4">Total Dépensé</th>
                <th className="p-4">Inscrit le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-semibold">{c.name}</td>
                  <td className="p-4 text-gray-600">{c.email}</td>
                  <td className="p-4 text-gray-600">{c.phone || '-'}</td>
                  <td className="p-4 font-bold">{c.orderCount}</td>
                  <td className="p-4 font-bold text-black">{c.totalSpent.toFixed(2)} TND</td>
                  <td className="p-4 text-xs text-gray-500">{new Date(c.createdAt).toLocaleDateString('fr-TN')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 bg-white text-gray-500">
          {t('admin.noCustomers')}
        </div>
      )}
    </div>
  );
}
