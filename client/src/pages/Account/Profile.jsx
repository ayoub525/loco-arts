import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

export default function Profile() {
  const { user } = useAuth();
  const { t } = useTranslation();

  return (
    <div className="container-custom section-padding max-w-2xl mx-auto">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-6">{t('auth.profile')}</h1>
      
      <div className="border border-gray-200 p-6 md:p-8 space-y-6 bg-white">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('auth.name')}</label>
          <div className="font-medium text-lg">{user?.name}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('auth.email')}</label>
          <div className="font-medium text-lg">{user?.email}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{t('auth.phone')}</label>
          <div className="font-medium text-lg">{user?.phone || 'Non renseigné'}</div>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Rôle</label>
          <div className="font-medium text-sm inline-block px-2 py-1 bg-gray-100">{user?.role}</div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex gap-4">
          <Link to="/compte/commandes" className="btn-secondary text-sm">
            {t('auth.myOrders')}
          </Link>
          {user?.role === 'ADMIN' && (
            <Link to="/admin" className="btn-primary text-sm">
              Panneau d'administration
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
