import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
  const { t } = useTranslation();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Les mots de passe ne correspondent pas');
    }
    setLoading(true);
    try {
      await registerUser({
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      toast.success('Compte créé avec succès !');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la création du compte');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom section-padding max-w-md mx-auto">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-6 text-center">{t('auth.register')}</h1>
      <form onSubmit={handleSubmit} className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.name')}</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.phone')}</label>
          <input
            type="text"
            placeholder="+216 XX XXX XXX"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.password')}</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.confirmPassword')}</label>
          <input
            type="password"
            required
            minLength={6}
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-4"
        >
          {loading ? t('common.loading') : t('auth.registerBtn')}
        </button>
        <p className="text-center text-sm text-gray-600 pt-4">
          {t('auth.hasAccount')}{' '}
          <Link to="/connexion" className="font-bold underline text-black">
            {t('auth.login')}
          </Link>
        </p>
      </form>
    </div>
  );
}
