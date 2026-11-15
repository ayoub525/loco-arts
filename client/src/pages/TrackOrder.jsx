import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../lib/axios';
import Badge from '../components/ui/Badge';

export default function TrackOrder() {
  const { t } = useTranslation();
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const res = await api.get('/orders/track', {
        params: { orderNumber: orderNumber.trim(), phone: phone.trim() },
      });
      setOrder(res.data);
    } catch (err) {
      setError(err.response?.data?.error || t('track.notFound'));
    } finally {
      setLoading(false);
    }
  };

  const steps = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'];
  const stepIndex = order ? steps.indexOf(order.status) : -1;

  return (
    <div className="container-custom section-padding max-w-2xl mx-auto">
      <h1 className="font-heading font-black text-4xl mb-4 text-center">{t('track.title')}</h1>
      <p className="text-gray-600 text-center mb-8">
        Entrez votre numéro de commande et votre téléphone pour suivre l'état de votre colis.
      </p>

      <form onSubmit={handleTrack} className="bg-gray-50 p-6 md:p-8 space-y-4 mb-8 border border-gray-200">
        <div>
          <label className="block text-sm font-semibold mb-1">{t('track.orderNumber')}</label>
          <input
            type="text"
            required
            placeholder="Ex: LOCO-20241115-0001"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold mb-1">{t('track.phone')}</label>
          <input
            type="text"
            required
            placeholder="+216 XX XXX XXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3"
        >
          {loading ? t('common.loading') : t('track.search')}
        </button>
      </form>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 border border-red-200 text-center mb-8">
          {error}
        </div>
      )}

      {order && (
        <div className="border border-gray-200 p-6 md:p-8 space-y-6 animate-fade-in bg-white">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Numéro</span>
              <span className="font-heading font-bold text-lg">{order.orderNumber}</span>
            </div>
            <div>
              <Badge variant={order.status}>{t(`status.${order.status}`)}</Badge>
            </div>
          </div>

          {/* Stepper */}
          {['CANCELLED', 'RETURNED'].includes(order.status) ? (
            <div className="p-4 bg-red-50 text-red-800 text-center font-semibold">
              Cette commande a été {order.status === 'CANCELLED' ? 'annulée' : 'retournée'}.
            </div>
          ) : (
            <div className="py-4">
              <div className="flex justify-between items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gray-200 w-full z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-black transition-all duration-500 z-0"
                  style={{ width: `${Math.max(0, (stepIndex / (steps.length - 1)) * 100)}%` }}
                />
                {steps.map((st, idx) => {
                  const active = idx <= stepIndex;
                  return (
                    <div key={st} className="relative z-10 flex flex-col items-center">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                          active ? 'bg-black text-white' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[10px] md:text-xs text-gray-600 mt-2 font-medium text-center hidden sm:block">
                        {t(`status.${st}`)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {order.shipment && (
            <div className="bg-gray-50 p-4 border border-gray-200 space-y-2">
              <h4 className="font-heading font-bold text-sm uppercase tracking-wide">Détails d'expédition</h4>
              <p className="text-sm"><span className="text-gray-500">{t('track.deliveryCompany')}:</span> {order.shipment.company}</p>
              <p className="text-sm"><span className="text-gray-500">{t('track.trackingNumber')}:</span> <span className="font-mono font-bold">{order.shipment.trackingNumber}</span></p>
              {order.shipment.shippedAt && (
                <p className="text-sm text-gray-500">Expédié le {new Date(order.shipment.shippedAt).toLocaleDateString('fr-TN')}</p>
              )}
            </div>
          )}

          <div>
            <h4 className="font-heading font-bold text-sm uppercase tracking-wide mb-3">Articles</h4>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item, idx) => (
                <div key={idx} className="py-2 flex justify-between text-sm">
                  <span>{item.name} (Taille {item.size}) × {item.quantity}</span>
                  <span className="font-semibold">{item.price * item.quantity} TND</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
