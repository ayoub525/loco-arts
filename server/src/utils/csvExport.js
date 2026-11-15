export function ordersToCSV(orders) {
  const headers = [
    'N° Commande', 'Client', 'Téléphone', 'Email', 'Gouvernorat', 'Ville',
    'Adresse', 'Statut', 'Paiement', 'Sous-total', 'Livraison', 'Total',
    'Notes', 'Date'
  ];

  const rows = orders.map(order => [
    order.orderNumber,
    order.guestName || order.user?.name || '',
    order.guestPhone || order.user?.phone || '',
    order.guestEmail || order.user?.email || '',
    order.address?.governorate || '',
    order.address?.city || '',
    order.address?.address || '',
    order.status,
    order.paymentMethod,
    order.subtotal,
    order.deliveryFee,
    order.total,
    order.notes || '',
    new Date(order.createdAt).toLocaleDateString('fr-TN'),
  ]);

  const escape = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const csv = [
    headers.map(escape).join(','),
    ...rows.map(row => row.map(escape).join(',')),
  ].join('\n');

  return '\uFEFF' + csv; // BOM for Excel
}
