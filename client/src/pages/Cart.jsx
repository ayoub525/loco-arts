import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../context/CartContext';

export default function Cart() {
  const { t } = useTranslation();
  const { items, removeFromCart, updateQuantity, cartTotal } = useCart();

  const deliveryFee = cartTotal >= 200 ? 0 : 8;
  const total = cartTotal + deliveryFee;

  if (items.length === 0) {
    return (
      <div className="container-custom section-padding text-center">
        <svg className="w-20 h-20 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <h1 className="font-heading font-black text-3xl mb-4">{t('cart.empty')}</h1>
        <Link to="/boutique" className="btn-primary inline-block">{t('cart.continueShopping')}</Link>
      </div>
    );
  }

  return (
    <div className="container-custom section-padding">
      <h1 className="font-heading font-black text-4xl mb-10">{t('cart.title')}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Items */}
        <div className="lg:col-span-2 space-y-6">
          {items.map((item) => (
            <div key={item.variantId} className="flex gap-4 border-b border-gray-100 pb-6">
              <div className="w-24 h-28 bg-gray-100 flex-shrink-0">
                {item.image && item.image !== '/placeholder-product.jpg' ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">📷</div>
                )}
              </div>
              <div className="flex-1">
                <Link to={`/produit/${item.slug}`} className="font-heading font-semibold hover:text-gray-600">{item.name}</Link>
                <p className="text-sm text-gray-500 mt-1">Taille: {item.size} {item.color && `· ${item.color}`}</p>
                <p className="font-heading font-bold mt-2">{item.price} {t('product.currency')}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeFromCart(item.variantId)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="flex items-center border border-gray-200">
                  <button onClick={() => updateQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 text-sm hover:bg-gray-50">−</button>
                  <span className="px-3 py-1 text-sm font-semibold border-x border-gray-200">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.variantId, item.quantity + 1)} className="px-3 py-1 text-sm hover:bg-gray-50">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="bg-gray-50 p-6 h-fit sticky top-28">
          <h3 className="font-heading font-bold text-lg mb-6">{t('checkout.orderSummary')}</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('cart.subtotal')}</span>
              <span className="font-semibold">{cartTotal.toFixed(2)} TND</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('cart.shipping')}</span>
              <span className="font-semibold">{deliveryFee === 0 ? t('cart.free') : `${deliveryFee} TND`}</span>
            </div>
            {cartTotal < 200 && (
              <p className="text-xs text-gray-500">{t('cart.freeShippingNote', { threshold: '200' })}</p>
            )}
            <div className="border-t border-gray-200 pt-3 flex justify-between text-lg">
              <span className="font-heading font-bold">{t('cart.total')}</span>
              <span className="font-heading font-black">{total.toFixed(2)} TND</span>
            </div>
          </div>
          <Link to="/commande" className="btn-primary block text-center mt-6 w-full">{t('cart.checkout')}</Link>
          <Link to="/boutique" className="block text-center text-sm text-gray-500 hover:text-black mt-3">{t('cart.continueShopping')}</Link>
        </div>
      </div>
    </div>
  );
}
