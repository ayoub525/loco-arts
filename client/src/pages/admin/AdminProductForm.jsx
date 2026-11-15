import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

const DEFAULT_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'];

export default function AdminProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    oldPrice: '',
    categoryId: '',
    isFeatured: false,
    isNew: true,
    isActive: true,
  });

  const [variants, setVariants] = useState(
    DEFAULT_SIZES.map(size => ({ size, color: 'Noir', stock: 5, isAvailable: true }))
  );

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  // If edit mode, fetch product details
  const { data: productData, isSuccess } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => api.get(`/admin/products/${id}`).then(r => r.data),
    enabled: isEdit,
  });

  useEffect(() => {
    if (isEdit && isSuccess && productData) {
      setForm({
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price?.toString() || '',
        oldPrice: productData.oldPrice?.toString() || '',
        categoryId: productData.categoryId || '',
        isFeatured: Boolean(productData.isFeatured),
        isNew: Boolean(productData.isNew),
        isActive: Boolean(productData.isActive),
      });

      if (productData.variants?.length > 0) {
        setVariants(productData.variants.map(v => ({
          id: v.id,
          size: v.size,
          color: v.color || 'Noir',
          stock: v.stock,
          isAvailable: v.isAvailable,
        })));
      }

      if (productData.images?.length > 0) {
        setExistingImages(productData.images);
      }
    } else if (!isEdit && categories?.length > 0 && !form.categoryId) {
      setForm(prev => ({ ...prev, categoryId: categories[0].id }));
    }
  }, [isEdit, isSuccess, productData, categories]);

  const handleVariantStockChange = (idx, value) => {
    const qty = parseInt(value) || 0;
    setVariants(prev => prev.map((v, i) => {
      if (i === idx) {
        return {
          ...v,
          stock: qty,
          isAvailable: qty > 0,
        };
      }
      return v;
    }));
  };

  const handleVariantToggleAvailable = (idx) => {
    setVariants(prev => prev.map((v, i) => {
      if (i === idx) {
        const nextAvail = !v.isAvailable;
        return {
          ...v,
          isAvailable: nextAvail,
          stock: nextAvail && v.stock === 0 ? 1 : v.stock,
        };
      }
      return v;
    }));
  };

  const handleMarkAllOOS = () => {
    setVariants(prev => prev.map(v => ({ ...v, stock: 0, isAvailable: false })));
  };

  const handleAddSizeRow = () => {
    const customSize = prompt('Entrez la pointure à ajouter (ex: 35, 47) :');
    if (customSize) {
      setVariants(prev => [...prev, { size: customSize.trim(), color: 'Noir', stock: 5, isAvailable: true }]);
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Supprimer cette photo ?')) return;
    try {
      await api.delete(`/admin/products/${id}/images/${imageId}`);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      toast.success('Photo supprimée');
    } catch {
      toast.error('Erreur lors de la suppression de la photo');
    }
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('description', form.description);
      formData.append('price', form.price);
      if (form.oldPrice) formData.append('oldPrice', form.oldPrice);
      formData.append('categoryId', form.categoryId);
      formData.append('isFeatured', form.isFeatured);
      formData.append('isNew', form.isNew);
      formData.append('isActive', form.isActive);
      formData.append('variants', JSON.stringify(variants));

      for (const file of selectedFiles) {
        formData.append('images', file);
      }

      if (isEdit) {
        return api.put(`/admin/products/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        return api.post('/admin/products', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(isEdit ? 'Produit mis à jour' : 'Produit créé avec succès');
      navigate('/admin/produits');
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la sauvegarde');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.categoryId) {
      return toast.error('Veuillez remplir les champs obligatoires');
    }
    saveMutation.mutate();
  };

  return (
    <div className="space-y-6 max-w-4xl pb-16">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/admin/produits" className="text-xs uppercase font-heading font-bold text-gray-500 hover:text-black mb-1 block">
            ← {t('admin.products')}
          </Link>
          <h1 className="font-heading font-black text-3xl">
            {isEdit ? t('admin.editProduct') : t('admin.addProduct')}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Infos de base */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            1. Informations de base
          </h2>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('admin.productName')} *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.productPrice')} *</label>
              <input
                type="number"
                step="0.1"
                required
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.oldPrice')}</label>
              <input
                type="number"
                step="0.1"
                value={form.oldPrice}
                onChange={(e) => setForm({ ...form, oldPrice: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.category')} *</label>
              <select
                required
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
              >
                <option value="">Sélectionnez...</option>
                {categories?.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">{t('admin.productDesc')}</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div className="flex flex-wrap gap-6 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
                className="accent-black w-4 h-4"
              />
              ⭐ {t('admin.featured')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isNew}
                onChange={(e) => setForm({ ...form, isNew: e.target.checked })}
                className="accent-black w-4 h-4"
              />
              🔥 {t('admin.newProduct')}
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                className="accent-black w-4 h-4"
              />
              👁️ {t('admin.visible')} sur la boutique
            </label>
          </div>
        </div>

        {/* Photos */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            2. {t('admin.photos')}
          </h2>

          {/* Existing images if edit */}
          {existingImages.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Photos actuelles :</p>
              <div className="flex flex-wrap gap-4">
                {existingImages.map((img) => (
                  <div key={img.id} className="relative w-20 h-24 border border-gray-200 overflow-hidden group">
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="absolute top-1 right-1 bg-black text-white w-5 h-5 flex items-center justify-center text-xs"
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload new images */}
          <div className="border-2 border-dashed border-gray-300 p-6 text-center">
            <input
              type="file"
              multiple
              accept="image/png, image/jpeg, image/webp"
              onChange={(e) => setSelectedFiles(Array.from(e.target.files || []))}
              className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-xs file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 cursor-pointer"
            />
            <p className="text-xs text-gray-400 mt-2">Format : JPG, PNG ou WebP. Max 5 Mo par photo.</p>
            {selectedFiles.length > 0 && (
              <p className="text-xs font-bold text-green-700 mt-2">
                {selectedFiles.length} nouvelle(s) photo(s) prête(s) à être envoyée(s).
              </p>
            )}
          </div>
        </div>

        {/* Tailles et Stock */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <div className="flex flex-wrap justify-between items-center gap-2">
            <div>
              <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
                3. {t('admin.sizesStock')}
              </h2>
              <p className="text-xs text-gray-500">
                Chaque pointure a son propre stock. Si la quantité est à 0, la taille est automatiquement marquée indisponible sur le site.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleMarkAllOOS}
                className="text-xs uppercase font-heading font-bold text-red-600 border border-red-200 px-3 py-1.5 hover:bg-red-50"
              >
                {t('admin.markAllOOS')}
              </button>
              <button
                type="button"
                onClick={handleAddSizeRow}
                className="btn-secondary text-xs py-1.5 px-3"
              >
                + Ajouter une pointure
              </button>
            </div>
          </div>

          <div className="border border-gray-200 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-heading text-gray-500">
                <tr>
                  <th className="p-3">Pointure</th>
                  <th className="p-3">Quantité en stock</th>
                  <th className="p-3">État</th>
                  <th className="p-3 text-right">Action rapide</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {variants.map((v, idx) => (
                  <tr key={idx} className={!v.isAvailable || v.stock === 0 ? 'bg-gray-50/70 text-gray-400' : ''}>
                    <td className="p-3 font-bold font-heading">{v.size}</td>
                    <td className="p-3">
                      <input
                        type="number"
                        min="0"
                        value={v.stock}
                        onChange={(e) => handleVariantStockChange(idx, e.target.value)}
                        className="w-24 border border-gray-200 px-2 py-1 text-sm focus:outline-none focus:border-black text-black"
                      />
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 font-bold ${
                        v.isAvailable && v.stock > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {v.isAvailable && v.stock > 0 ? 'En stock' : 'Épuisé'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleVariantToggleAvailable(idx)}
                        className="text-xs uppercase font-heading underline font-bold"
                      >
                        {v.isAvailable ? 'Basculer en épuisé' : 'Réactiver'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={saveMutation.isPending}
            className="btn-primary py-3 px-8 text-sm disabled:opacity-50"
          >
            {saveMutation.isPending ? 'Enregistrement...' : t('admin.save')}
          </button>
          <Link to="/admin/produits" className="btn-secondary py-3 px-8 text-sm">
            {t('admin.cancel')}
          </Link>
        </div>
      </form>
    </div>
  );
}
