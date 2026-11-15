import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function OrderConfirmation() {
  const { orderNumber } = useParams();
  const { t } = useTranslation();

  return (
    <div className="container-custom section-padding text-center max-w-2xl mx-auto">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="font-heading font-black text-4xl mb-4">{t('confirmation.title')}</h1>
      <p className="text-gray-600 text-lg mb-8">{t('confirmation.subtitle')}</p>

      <div className="bg-gray-50 p-8 mb-8">
        <p className="text-sm text-gray-500 mb-2">{t('confirmation.orderNumber')}</p>
        <p className="font-heading font-black text-2xl">{orderNumber}</p>
      </div>

      <p className="text-gray-600 mb-8">{t('confirmation.estimatedDelivery')}</p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link to={`/suivre-commande`} className="btn-primary">{t('confirmation.trackOrder')}</Link>
        <Link to="/boutique" className="btn-secondary">{t('confirmation.continueShopping')}</Link>
      </div>
    </div>
  );
}
