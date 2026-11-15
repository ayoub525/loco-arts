import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(email, password);
      toast.success(`Bienvenue, ${user.name} !`);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom section-padding max-w-md mx-auto">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-6 text-center">{t('auth.login')}</h1>
      <form onSubmit={handleSubmit} className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.email')}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('auth.password')}</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 mt-4"
        >
          {loading ? t('common.loading') : t('auth.loginBtn')}
        </button>
        <p className="text-center text-sm text-gray-600 pt-4">
          {t('auth.noAccount')}{' '}
          <Link to="/inscription" className="font-bold underline text-black">
            {t('auth.register')}
          </Link>
        </p>
      </form>
    </div>
  );
}
