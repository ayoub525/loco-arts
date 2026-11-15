import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function AdminSettings() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [settings, setSettings] = useState({
    shopName: '',
    tagline: '',
    phone: '',
    email: '',
    address: '',
    deliveryFee: '8',
    freeShippingThreshold: '200',
    heroTitle: '',
    heroSubtitle: '',
    instagram: '',
    facebook: '',
    tiktok: '',
  });

  const { data, isSuccess } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => api.get('/admin/settings').then(r => r.data),
  });

  useEffect(() => {
    if (isSuccess && data) {
      setSettings(prev => ({ ...prev, ...data }));
    }
  }, [isSuccess, data]);

  const updateMutation = useMutation({
    mutationFn: (newSettings) => api.put('/admin/settings', newSettings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Paramètres enregistrés avec succès');
    },
    onError: () => toast.error("Erreur lors de l'enregistrement"),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateMutation.mutate(settings);
  };

  return (
    <div className="space-y-6 max-w-3xl pb-16">
      <div>
        <h1 className="font-heading font-black text-3xl">{t('admin.settings')}</h1>
        <p className="text-gray-500 text-sm">Configurez les coordonnées, frais de port et textes du site</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Boutique & Branding */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            🏪 1. Boutique
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.shopName')}</label>
              <input
                type="text"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Slogan</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Livraison */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            🚚 2. Livraison & Tarifs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.deliveryFee')}</label>
              <input
                type="number"
                step="0.5"
                value={settings.deliveryFee}
                onChange={(e) => setSettings({ ...settings, deliveryFee: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('admin.freeShippingThreshold')}</label>
              <input
                type="number"
                step="5"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Coordonnées & Réseaux */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            📞 3. Contact & Réseaux Sociaux
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Téléphone</label>
              <input
                type="text"
                value={settings.phone}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">Adresse</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Instagram URL</label>
              <input
                type="text"
                value={settings.instagram}
                onChange={(e) => setSettings({ ...settings, instagram: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Facebook URL</label>
              <input
                type="text"
                value={settings.facebook}
                onChange={(e) => setSettings({ ...settings, facebook: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold mb-1">TikTok URL</label>
              <input
                type="text"
                value={settings.tiktok}
                onChange={(e) => setSettings({ ...settings, tiktok: e.target.value })}
                className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Accueil */}
        <div className="border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
            🎨 4. Bannière d'accueil
          </h2>
          <div>
            <label className="block text-sm font-semibold mb-1">Titre principal</label>
            <input
              type="text"
              value={settings.heroTitle}
              onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">Sous-titre</label>
            <textarea
              rows={2}
              value={settings.heroSubtitle}
              onChange={(e) => setSettings({ ...settings, heroSubtitle: e.target.value })}
              className="w-full border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:border-black"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={updateMutation.isPending}
          className="btn-primary py-3 px-8 text-sm"
        >
          {updateMutation.isPending ? 'Enregistrement...' : t('admin.save')}
        </button>
      </form>
    </div>
  );
}
