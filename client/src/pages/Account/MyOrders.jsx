import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../../lib/axios';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';

export default function MyOrders() {
  const { t } = useTranslation();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: () => api.get('/orders/my').then(r => r.data),
  });

  return (
    <div className="container-custom section-padding">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-8">{t('auth.myOrders')}</h1>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      ) : orders?.length > 0 ? (
        <div className="border border-gray-200 overflow-x-auto bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200 uppercase font-heading text-xs tracking-wider text-gray-500">
              <tr>
                <th className="p-4">N° Commande</th>
                <th className="p-4">Date</th>
                <th className="p-4">Total</th>
                <th className="p-4">Articles</th>
                <th className="p-4">Statut</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-mono font-bold">{o.orderNumber}</td>
                  <td className="p-4 text-gray-600">{new Date(o.createdAt).toLocaleDateString('fr-TN')}</td>
                  <td className="p-4 font-semibold">{o.total.toFixed(2)} TND</td>
                  <td className="p-4 text-gray-600">{o.items?.length || 0} article(s)</td>
                  <td className="p-4">
                    <Badge variant={o.status}>{t(`status.${o.status}`)}</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      to={`/compte/commandes/${o.id}`}
                      className="text-xs uppercase font-heading font-bold underline hover:text-gray-600"
                    >
                      Détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-16 border border-gray-200 bg-gray-50">
          <p className="text-gray-500 mb-4">Vous n'avez pas encore passé de commande.</p>
          <Link to="/boutique" className="btn-primary inline-block text-sm">
            Découvrir la boutique
          </Link>
        </div>
      )}
    </div>
  );
}
