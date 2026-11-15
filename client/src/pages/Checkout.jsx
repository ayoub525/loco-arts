import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { useCart } from '../context/CartContext';
import api from '../lib/axios';
import toast from 'react-hot-toast';

const GOVERNORATES = [
  'Tunis', 'Ariana', 'Ben Arous', 'Manouba', 'Nabeul', 'Zaghouan',
  'Bizerte', 'Béja', 'Jendouba', 'Kef', 'Siliana', 'Sousse',
  'Monastir', 'Mahdia', 'Sfax', 'Kairouan', 'Kasserine', 'Sidi Bouzid',
  'Gabès', 'Médenine', 'Tataouine', 'Gafsa', 'Tozeur', 'Kébili',
];

export default function Checkout() {
  const { t } = useTranslation();
  const { items, cartTotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm();

  const deliveryFee = cartTotal >= 200 ? 0 : 8;
  const total = cartTotal + deliveryFee;

  if (items.length === 0) {
    navigate('/panier');
    return null;
  }

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const orderData = {
        ...data,
        paymentMethod: 'CASH_ON_DELIVERY',
        items: items.map(i => ({
          variantId: i.variantId,
          productId: i.productId,
          quantity: i.quantity,
        })),
      };
      const res = await api.post('/orders', orderData);
      clearCart();
      toast.success('Commande passée avec succès !');
      navigate(`/confirmation/${res.data.orderNumber}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la commande');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container-custom section-padding">
      <h1 className="font-heading font-black text-4xl mb-10">{t('checkout.title')}</h1>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            {/* Personal info */}
            <div>
              <h2 className="font-heading font-bold text-lg mb-4">{t('checkout.personalInfo')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('checkout.fullName')} *</label>
                  <input {...register('fullName', { required: true, minLength: 2 })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                  {errors.fullName && <p className="text-red-500 text-xs mt-1">Nom requis</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('checkout.phone')} *</label>
                  <input {...register('phone', { required: true, minLength: 8 })} placeholder="+216 XX XXX XXX" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                  {errors.phone && <p className="text-red-500 text-xs mt-1">Téléphone requis</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">{t('checkout.email')}</label>
                  <input {...register('email')} type="email" className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                </div>
              </div>
            </div>

            {/* Address */}
            <div>
              <h2 className="font-heading font-bold text-lg mb-4">{t('checkout.shippingAddress')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('checkout.governorate')} *</label>
                  <select {...register('governorate', { required: true })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black">
                    <option value="">{t('checkout.selectGovernorate')}</option>
                    {GOVERNORATES.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                  {errors.governorate && <p className="text-red-500 text-xs mt-1">Gouvernorat requis</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">{t('checkout.city')} *</label>
                  <input {...register('city', { required: true })} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                  {errors.city && <p className="text-red-500 text-xs mt-1">Ville requise</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">{t('checkout.address')} *</label>
                  <textarea {...register('address', { required: true, minLength: 5 })} rows={3} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                  {errors.address && <p className="text-red-500 text-xs mt-1">Adresse requise</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">{t('checkout.notes')}</label>
                  <textarea {...register('notes')} rows={2} className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black" />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div>
              <h2 className="font-heading font-bold text-lg mb-4">{t('checkout.payment')}</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 border border-black p-4 cursor-pointer">
                  <input type="radio" checked readOnly className="accent-black" />
                  <span className="font-semibold text-sm">{t('checkout.cashOnDelivery')}</span>
                </label>
                <label className="flex items-center gap-3 border border-gray-200 p-4 opacity-50 cursor-not-allowed">
                  <input type="radio" disabled className="accent-black" />
                  <span className="text-sm">{t('checkout.onlinePayment')} — <span className="text-gray-400">{t('checkout.comingSoon')}</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="bg-gray-50 p-6 h-fit sticky top-28">
            <h3 className="font-heading font-bold text-lg mb-6">{t('checkout.orderSummary')}</h3>
            <div className="space-y-3 mb-6">
              {items.map(item => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="text-gray-600">{item.name} (×{item.quantity}) — {item.size}</span>
                  <span>{(item.price * item.quantity).toFixed(2)} TND</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-200 pt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>{t('cart.subtotal')}</span><span>{cartTotal.toFixed(2)} TND</span></div>
              <div className="flex justify-between"><span>{t('cart.shipping')}</span><span>{deliveryFee === 0 ? t('cart.free') : `${deliveryFee} TND`}</span></div>
              <div className="flex justify-between font-heading font-black text-lg border-t border-gray-200 pt-3">
                <span>{t('cart.total')}</span><span>{total.toFixed(2)} TND</span>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-primary w-full mt-6 disabled:opacity-50">
              {submitting ? t('common.loading') : t('checkout.placeOrder')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
