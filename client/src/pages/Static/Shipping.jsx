import { useTranslation } from 'react-i18next';

export default function Shipping() {
  const { t } = useTranslation();

  return (
    <div className="container-custom section-padding max-w-3xl mx-auto space-y-12">
      <h1 className="font-heading font-black text-4xl md:text-5xl mb-6">{t('pages.shipping.title')}</h1>

      <div className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
        <h2 className="font-heading font-bold text-xl">{t('pages.shipping.deliveryTitle')}</h2>
        <p className="text-gray-700 leading-relaxed">{t('pages.shipping.deliveryText')}</p>
        <div className="bg-gray-50 p-4 border border-gray-100 text-sm font-semibold">
          {t('pages.shipping.deliveryFee')}
        </div>
      </div>

      <div className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
        <h2 className="font-heading font-bold text-xl">{t('pages.shipping.returnsTitle')}</h2>
        <p className="text-gray-700 leading-relaxed">{t('pages.shipping.returnsText')}</p>
        <p className="text-gray-500 text-sm">{t('pages.shipping.contact')}</p>
      </div>
    </div>
  );
}
