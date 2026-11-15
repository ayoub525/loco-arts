import PDFDocument from 'pdfkit';

export function generateOrderPDF(order) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    const buffers = [];

    doc.on('data', (chunk) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // Header
    doc.fontSize(24).font('Helvetica-Bold').text('LOCO Arts', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('CR.EATIVE STUDIO · Tunis, Tunisie', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
    doc.moveDown();

    // Order info
    doc.fontSize(16).font('Helvetica-Bold').text(`Bon de commande`);
    doc.fontSize(11).font('Helvetica');
    doc.moveDown(0.5);
    doc.text(`N° Commande: ${order.orderNumber}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-TN')}`);
    doc.text(`Statut: ${order.status}`);
    doc.text(`Paiement: ${order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Paiement à la livraison' : 'En ligne'}`);
    doc.moveDown();

    // Customer info
    doc.fontSize(13).font('Helvetica-Bold').text('Informations client');
    doc.fontSize(11).font('Helvetica');
    const name = order.guestName || order.user?.name || 'N/A';
    const phone = order.guestPhone || order.user?.phone || 'N/A';
    const email = order.guestEmail || order.user?.email || '';
    doc.text(`Nom: ${name}`);
    doc.text(`Téléphone: ${phone}`);
    if (email) doc.text(`Email: ${email}`);
    if (order.address) {
      doc.text(`Adresse: ${order.address.address}, ${order.address.city}`);
      doc.text(`Gouvernorat: ${order.address.governorate}`);
    }
    if (order.notes) doc.text(`Notes: ${order.notes}`);
    doc.moveDown();

    // Items table
    doc.fontSize(13).font('Helvetica-Bold').text('Articles');
    doc.moveDown(0.5);

    // Table header
    const tableTop = doc.y;
    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Produit', 40, tableTop, { width: 200 });
    doc.text('Taille', 250, tableTop, { width: 60 });
    doc.text('Couleur', 310, tableTop, { width: 70 });
    doc.text('Qté', 390, tableTop, { width: 40 });
    doc.text('Prix', 440, tableTop, { width: 55 });
    doc.text('Total', 500, tableTop, { width: 55 });
    doc.moveDown(0.3);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

    doc.font('Helvetica').fontSize(10);
    let y = doc.y + 5;
    for (const item of order.items) {
      doc.text(item.name, 40, y, { width: 200 });
      doc.text(item.size, 250, y, { width: 60 });
      doc.text(item.color || '-', 310, y, { width: 70 });
      doc.text(String(item.quantity), 390, y, { width: 40 });
      doc.text(`${item.price} TND`, 440, y, { width: 55 });
      doc.text(`${(item.price * item.quantity).toFixed(2)} TND`, 500, y, { width: 55 });
      y += 20;
    }

    doc.moveTo(40, y + 5).lineTo(555, y + 5).stroke();
    y += 15;

    // Totals
    doc.font('Helvetica').fontSize(11);
    doc.text(`Sous-total: ${order.subtotal.toFixed(2)} TND`, 400, y);
    y += 18;
    doc.text(`Livraison: ${order.deliveryFee.toFixed(2)} TND`, 400, y);
    y += 18;
    doc.font('Helvetica-Bold').fontSize(13);
    doc.text(`Total: ${order.total.toFixed(2)} TND`, 400, y);

    // Shipment info if exists
    if (order.shipment) {
      y += 35;
      doc.font('Helvetica-Bold').fontSize(12).text('Expédition', 40, y);
      y += 18;
      doc.font('Helvetica').fontSize(10);
      doc.text(`Transporteur: ${order.shipment.company}`, 40, y);
      y += 15;
      doc.text(`N° Suivi: ${order.shipment.trackingNumber}`, 40, y);
      if (order.shipment.shippedAt) {
        y += 15;
        doc.text(`Date d'expédition: ${new Date(order.shipment.shippedAt).toLocaleDateString('fr-TN')}`, 40, y);
      }
    }

    // Footer
    doc.fontSize(8).font('Helvetica')
      .text('LOCO Arts · Custom Arts · Renovation · Repair · Making · Tunis, Tunisie', 40, 770, { align: 'center' });

    doc.end();
  });
}
