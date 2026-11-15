import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="container-custom section-padding text-center py-24">
      <h1 className="font-heading font-black text-8xl md:text-9xl tracking-tight mb-4">404</h1>
      <h2 className="font-heading font-bold text-2xl mb-4">{t('notFound.title')}</h2>
      <p className="text-gray-500 mb-8">{t('notFound.message')}</p>
      <Link to="/" className="btn-primary inline-block">
        {t('notFound.backHome')}
      </Link>
    </div>
  );
}
