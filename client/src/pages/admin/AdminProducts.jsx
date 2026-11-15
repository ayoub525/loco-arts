import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', search, page],
    queryFn: () => api.get('/admin/products', {
      params: { search: search || undefined, page, limit: 15 },
    }).then(r => r.data),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/products/${id}/toggle-status`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Statut du produit modifié');
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id) => api.post(`/admin/products/${id}/duplicate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success('Produit dupliqué avec succès');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/products/${id}`),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(res.data.message || 'Produit supprimé');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDelete = (id, name) => {
    if (window.confirm(`Supprimer le produit "${name}" ?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="font-heading font-black text-3xl">{t('admin.products')}</h1>
          <p className="text-gray-500 text-sm">Gérez le catalogue, les prix, photos et pointures</p>
        </div>
        <Link to="/admin/produits/nouveau" className="btn-primary text-xs tracking-wider">
          + {t('admin.addProduct')}
        </Link>
      </div>

      <div className="bg-white p-4 border border-gray-200">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
        />
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
        </div>
      ) : data?.products?.length > 0 ? (
        <div className="border border-gray-200 bg-white overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase font-heading text-xs text-gray-500">
              <tr>
                <th className="p-4">Photo</th>
                <th className="p-4">Nom</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Stock Total</th>
                <th className="p-4">Visibilité</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.products.map((p) => {
                const totalStock = p.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                const photo = p.images?.[0]?.url;

                return (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 w-16">
                      <div className="w-12 h-14 bg-gray-100 flex items-center justify-center text-xs overflow-hidden">
                        {photo && photo !== '/placeholder-product.jpg' ? (
                          <img src={photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span>📷</span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 font-semibold">{p.name}</td>
                    <td className="p-4 text-gray-600">{p.category?.name || '-'}</td>
                    <td className="p-4 font-bold">{p.price.toFixed(2)} TND</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 text-xs font-bold ${totalStock < 5 ? 'bg-orange-100 text-orange-800' : 'bg-gray-100 text-gray-800'}`}>
                        {totalStock} paire(s)
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => toggleStatusMutation.mutate(p.id)}
                        className={`text-xs px-2.5 py-1 font-semibold ${
                          p.isActive ? 'bg-black text-white' : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {p.isActive ? t('admin.visible') : t('admin.hidden')}
                      </button>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Link
                        to={`/admin/produits/${p.id}/modifier`}
                        className="text-xs uppercase font-heading font-bold underline hover:text-gray-600"
                      >
                        {t('admin.edit')}
                      </Link>
                      <button
                        onClick={() => duplicateMutation.mutate(p.id)}
                        className="text-xs uppercase font-heading font-bold text-gray-500 hover:text-black"
                      >
                        {t('admin.duplicate')}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id, p.name)}
                        className="text-xs uppercase font-heading font-bold text-red-600 hover:text-red-800"
                      >
                        {t('admin.delete')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 bg-white text-gray-500">
          {t('admin.noProducts')}
        </div>
      )}

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
