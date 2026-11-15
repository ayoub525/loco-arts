import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import Badge from '../../components/ui/Badge';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

const STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'];
const COURIERS = ['Aramex', 'First Delivery', 'Rapid Poste', 'Autre'];

export default function AdminOrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [newStatus, setNewStatus] = useState('');
  const [shipmentData, setShipmentData] = useState({ company: 'Aramex', trackingNumber: '', notes: '' });

  const { data: order, isLoading } = useQuery({
    queryKey: ['admin-order-detail', id],
    queryFn: () => api.get(`/admin/orders/${id}`).then(r => {
      setNewStatus(r.data.status);
      if (r.data.shipment) {
        setShipmentData({
          company: r.data.shipment.company || 'Aramex',
          trackingNumber: r.data.shipment.trackingNumber || '',
          notes: r.data.shipment.notes || '',
        });
      }
      return r.data;
    }),
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status) => api.patch(`/admin/orders/${id}/status`, { status }),
    onSuccess: () => {
      toast.success('Statut mis à jour avec succès');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || 'Erreur lors de la mise à jour du statut');
    },
  });

  const saveShipmentMutation = useMutation({
    mutationFn: (data) => api.post(`/admin/orders/${id}/shipment`, data),
    onSuccess: () => {
      toast.success('Informations de livraison enregistrées');
      queryClient.invalidateQueries({ queryKey: ['admin-order-detail', id] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.error || "Erreur lors de l'enregistrement");
    },
  });

  const handlePrint = () => {
    window.open(`/api/admin/orders/${id}/pdf`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!order) return <p>Commande non trouvée</p>;

  const customerName = order.guestName || order.user?.name || 'Client';
  const customerPhone = order.guestPhone || order.user?.phone || order.address?.phone || '-';
  const customerEmail = order.guestEmail || order.user?.email || '-';

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <Link to="/admin/commandes" className="text-xs uppercase font-heading font-bold text-gray-500 hover:text-black mb-1 block">
            ← {t('admin.orders')}
          </Link>
          <h1 className="font-heading font-black text-3xl">Commande {order.orderNumber}</h1>
          <p className="text-xs text-gray-500 mt-1">
            Créée le {new Date(order.createdAt).toLocaleString('fr-TN')}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="btn-secondary text-xs">
            📄 {t('admin.printOrder')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left col: Items and Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status changer */}
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
              {t('admin.updateStatus')}
            </h2>
            <div className="flex flex-wrap gap-3 items-center">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="border border-gray-200 px-4 py-2.5 text-sm font-semibold focus:outline-none focus:border-black flex-1"
              >
                {STATUSES.map(st => (
                  <option key={st} value={st}>{t(`status.${st}`)}</option>
                ))}
              </select>
              <button
                onClick={() => updateStatusMutation.mutate(newStatus)}
                disabled={newStatus === order.status || updateStatusMutation.isPending}
                className="btn-primary text-xs py-2.5 px-6 disabled:opacity-50"
              >
                Appliquer
              </button>
            </div>
            <p className="text-xs text-gray-500 italic">
              * Confirmer une commande déduit automatiquement le stock. L'annuler ou la retourner réapprovisionne le stock.
            </p>
          </div>

          {/* Items */}
          <div className="border border-gray-200 bg-white p-6">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide mb-4">
              {t('admin.orderItems')}
            </h2>
            <div className="divide-y divide-gray-100">
              {order.items?.map((item) => (
                <div key={item.id} className="py-3 flex justify-between items-center text-sm">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-xs text-gray-500">
                      Taille: <span className="font-bold text-black">{item.size}</span>
                      {item.color && ` · Couleur: ${item.color}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{(item.price * item.quantity).toFixed(2)} TND</p>
                    <p className="text-xs text-gray-500">{item.quantity} × {item.price.toFixed(2)} TND</p>
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
                <span>Frais de livraison</span>
                <span>{order.deliveryFee === 0 ? 'Gratuit' : `${order.deliveryFee.toFixed(2)} TND`}</span>
              </div>
              <div className="flex justify-between font-heading font-black text-lg pt-2 border-t border-gray-100">
                <span>Total</span>
                <span>{order.total.toFixed(2)} TND</span>
              </div>
            </div>
          </div>

          {/* Delivery & Shipment */}
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
              📦 Section Colis & Expédition
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                  Société de livraison
                </label>
                <select
                  value={shipmentData.company}
                  onChange={(e) => setShipmentData({ ...shipmentData, company: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                >
                  {COURIERS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                  Numéro de suivi (Tracking)
                </label>
                <input
                  type="text"
                  placeholder="Ex: ARX-99882211"
                  value={shipmentData.trackingNumber}
                  onChange={(e) => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">
                  Remarques transporteur (optionnel)
                </label>
                <input
                  type="text"
                  value={shipmentData.notes}
                  onChange={(e) => setShipmentData({ ...shipmentData, notes: e.target.value })}
                  className="w-full border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black"
                />
              </div>
            </div>
            <button
              onClick={() => saveShipmentMutation.mutate(shipmentData)}
              disabled={!shipmentData.trackingNumber || saveShipmentMutation.isPending}
              className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
            >
              {saveShipmentMutation.isPending ? 'Enregistrement...' : t('admin.saveShipment')}
            </button>
          </div>
        </div>

        {/* Right col: Customer Info & Address */}
        <div className="space-y-6">
          <div className="border border-gray-200 bg-white p-6 space-y-4">
            <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
              {t('admin.customerInfo')}
            </h2>
            <div className="text-sm space-y-2">
              <p><span className="text-gray-500">Nom :</span> <span className="font-semibold">{customerName}</span></p>
              <p><span className="text-gray-500">Téléphone :</span> <a href={`tel:${customerPhone}`} className="font-semibold underline">{customerPhone}</a></p>
              <p><span className="text-gray-500">Email :</span> {customerEmail}</p>
              <p><span className="text-gray-500">Paiement :</span> {order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Espèces à la livraison' : 'En ligne'}</p>
            </div>
          </div>

          {order.address && (
            <div className="border border-gray-200 bg-white p-6 space-y-4">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
                Adresse de livraison
              </h2>
              <div className="text-sm space-y-1 text-gray-700">
                <p className="font-semibold text-black">{order.address.fullName}</p>
                <p>{order.address.address}</p>
                <p>{order.address.city}, <span className="font-bold">{order.address.governorate}</span></p>
                <p className="pt-2 text-xs text-gray-500">📞 {order.address.phone}</p>
              </div>
            </div>
          )}

          {order.notes && (
            <div className="border border-gray-200 bg-white p-6 space-y-2">
              <h2 className="font-heading font-bold text-sm uppercase tracking-wide">
                Notes du client
              </h2>
              <p className="text-sm text-gray-700 italic bg-gray-50 p-3">{order.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
