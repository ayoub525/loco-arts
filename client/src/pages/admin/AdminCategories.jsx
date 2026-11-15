import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminCategories() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const { data: categories, isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => api.get('/admin/categories').then(r => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (name) => api.post('/admin/categories', { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setNewCategoryName('');
      toast.success('Catégorie ajoutée');
    },
    onError: (err) => toast.error(err.response?.data?.error || "Erreur lors de l'ajout"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }) => api.put(`/admin/categories/${id}`, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setEditingId(null);
      toast.success('Catégorie mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success('Catégorie supprimée');
    },
    onError: (err) => toast.error(err.response?.data?.error || 'Impossible de supprimer cette catégorie'),
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    createMutation.mutate(newCategoryName.trim());
  };

  const handleUpdate = (id) => {
    if (!editingName.trim()) return;
    updateMutation.mutate({ id, name: editingName.trim() });
  };

  const handleDelete = (id, count) => {
    if (count > 0) {
      return toast.error('Cette catégorie contient des produits et ne peut pas être supprimée.');
    }
    if (window.confirm('Supprimer cette catégorie ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-heading font-black text-3xl">{t('admin.categories')}</h1>
        <p className="text-gray-500 text-sm">Organisez les collections de la boutique</p>
      </div>

      {/* Add form */}
      <form onSubmit={handleCreate} className="border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-heading font-bold text-sm uppercase tracking-wide">{t('admin.addCategory')}</h2>
        <div className="flex gap-4">
          <input
            type="text"
            required
            placeholder="Ex: Bottines, Chaussons..."
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            className="border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black flex-1"
          />
          <button type="submit" disabled={createMutation.isPending} className="btn-primary text-xs py-2.5 px-6">
            Ajouter
          </button>
        </div>
      </form>

      {/* Categories List */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <div className="border border-gray-200 bg-white divide-y divide-gray-100">
          {categories?.map((c) => (
            <div key={c.id} className="p-4 flex items-center justify-between gap-4">
              {editingId === c.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="border border-gray-200 px-3 py-1.5 text-sm focus:outline-none focus:border-black flex-1"
                  />
                  <button onClick={() => handleUpdate(c.id)} className="btn-primary text-[10px] px-3 py-1.5">
                    {t('admin.save')}
                  </button>
                  <button onClick={() => setEditingId(null)} className="btn-secondary text-[10px] px-3 py-1.5">
                    {t('admin.cancel')}
                  </button>
                </div>
              ) : (
                <>
                  <div>
                    <h3 className="font-heading font-bold text-base">{c.name}</h3>
                    <p className="text-xs text-gray-500">
                      Slug: /{c.slug} · {c._count?.products || 0} produit(s)
                    </p>
                  </div>
                  <div className="flex gap-4 text-xs font-heading font-bold">
                    <button
                      onClick={() => { setEditingId(c.id); setEditingName(c.name); }}
                      className="underline hover:text-gray-600"
                    >
                      {t('admin.edit')}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id, c._count?.products || 0)}
                      className="text-red-600 hover:text-red-800"
                    >
                      {t('admin.delete')}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
