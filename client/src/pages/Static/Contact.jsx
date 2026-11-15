import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function Contact() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', body: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/contact', form);
      toast.success(t('contact.success'));
      setForm({ name: '', email: '', phone: '', subject: '', body: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom section-padding">
      <h1 className="font-heading font-black text-4xl md:text-5xl mb-8">{t('contact.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <form onSubmit={handleSubmit} className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-semibold mb-1">{t('contact.name')} *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1">{t('contact.email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">{t('contact.phone')}</label>
              <input
                type="text"
                placeholder="+216 XX XXX XXX"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('contact.subject')}</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1">{t('contact.message')} *</label>
            <textarea
              required
              rows={5}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? t('common.loading') : t('contact.send')}
          </button>
        </form>

        <div className="space-y-8 bg-gray-50 p-6 md:p-8 border border-gray-200 flex flex-col justify-center">
          <div>
            <h3 className="font-heading font-black text-xl mb-2">LOCO Arts Creative Studio</h3>
            <p className="text-gray-600 text-sm">Custom Arts · Renovation · Repair · Making</p>
          </div>
          <div className="space-y-4 text-sm text-gray-700">
            <div>
              <span className="font-heading font-bold block text-xs uppercase text-gray-400">Atelier & Boutique</span>
              <p>Tunis, Tunisie</p>
            </div>
            <div>
              <span className="font-heading font-bold block text-xs uppercase text-gray-400">Téléphone</span>
              <p>+216 12 345 678</p>
            </div>
            <div>
              <span className="font-heading font-bold block text-xs uppercase text-gray-400">Email</span>
              <p>contact@LocoArts.tn</p>
            </div>
            <div>
              <span className="font-heading font-bold block text-xs uppercase text-gray-400">Horaires d'ouverture</span>
              <p>Lundi - Samedi : 09h00 - 19h00</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
