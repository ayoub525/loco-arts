import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

export default function OrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order-detail', id],
    queryFn: () => api.get(`/orders/my/${id}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="container-custom section-padding max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container-custom section-padding text-center">
        <p className="text-gray-500 mb-4">Commande introuvable.</p>
        <Link to="/compte/commandes" className="btn-secondary text-sm">Mes commandes</Link>
      </div>
    );
  }

  return (
    <div className="container-custom section-padding max-w-3xl mx-auto space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <Link to="/compte/commandes" className="text-xs uppercase font-heading font-bold text-gray-500 hover:text-black mb-2 inline-block">
            ← Retour à mes commandes
          </Link>
          <h1 className="font-heading font-black text-2xl md:text-3xl">Commande {order.orderNumber}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Passée le {new Date(order.createdAt).toLocaleDateString('fr-TN')}
          </p>
        </div>
        <Badge variant={order.status}>{t(`status.${order.status}`)}</Badge>
      </div>

      {order.shipment && (
        <div className="border border-gray-200 p-6 bg-gray-50 space-y-2">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wide">Suivi d'expédition</h3>
          <p className="text-sm"><span className="text-gray-500">Transporteur :</span> {order.shipment.company}</p>
          <p className="text-sm"><span className="text-gray-500">N° de suivi :</span> <span className="font-mono font-bold">{order.shipment.trackingNumber}</span></p>
          {order.shipment.shippedAt && (
            <p className="text-xs text-gray-500">Expédié le {new Date(order.shipment.shippedAt).toLocaleDateString('fr-TN')}</p>
          )}
        </div>
      )}

      <div className="border border-gray-200 p-6 bg-white">
        <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-4">Articles commandés</h3>
        <div className="divide-y divide-gray-100">
          {order.items?.map((item) => (
            <div key={item.id} className="py-3 flex justify-between items-center text-sm">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-xs text-gray-500">Taille: {item.size} {item.color && `· ${item.color}`}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.price * item.quantity} TND</p>
                <p className="text-xs text-gray-500">{item.quantity} × {item.price} TND</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 mt-6 pt-4 space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Sous-total</span>
            <span>{order.subtotal.toFixed(2)} TND</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Livraison</span>
            <span>{order.deliveryFee === 0 ? 'Gratuit' : `${order.deliveryFee.toFixed(2)} TND`}</span>
          </div>
          <div className="flex justify-between font-heading font-bold text-lg pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{order.total.toFixed(2)} TND</span>
          </div>
        </div>
      </div>

      {order.address && (
        <div className="border border-gray-200 p-6 bg-white">
          <h3 className="font-heading font-bold text-sm uppercase tracking-wide mb-3">Adresse de livraison</h3>
          <p className="text-sm font-semibold">{order.address.fullName}</p>
          <p className="text-sm text-gray-600">{order.address.address}</p>
          <p className="text-sm text-gray-600">{order.address.city}, {order.address.governorate}</p>
          <p className="text-sm text-gray-600 mt-2">📞 {order.address.phone}</p>
        </div>
      )}
    </div>
  );
}
