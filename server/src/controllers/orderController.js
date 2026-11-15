import prisma from '../lib/prisma.js';
import { generateOrderNumber } from '../utils/orderNumber.js';

const ORDER_INCLUDE = {
  address: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
  items: {
    include: {
      product: { include: { images: { take: 1, orderBy: { sortOrder: 'asc' } } } },
      variant: true,
    },
  },
  shipment: true,
};

// ─── Public ──────────────────────────────────────────────────────────────────

export async function createOrder(req, res, next) {
  try {
    const {
      fullName, phone, email, governorate, city, address: addressLine,
      guestName, guestPhone, guestEmail,
      paymentMethod, notes, items,
    } = req.body;

    // Get delivery fee from settings
    const deliverySetting = await prisma.setting.findUnique({ where: { key: 'deliveryFee' } });
    const freeThresholdSetting = await prisma.setting.findUnique({ where: { key: 'freeShippingThreshold' } });
    const deliveryFeeValue = parseFloat(deliverySetting?.value || '8');
    const freeThreshold = parseFloat(freeThresholdSetting?.value || '200');

    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = subtotal >= freeThreshold ? 0 : deliveryFeeValue;
    const total = subtotal + deliveryFee;

    const order = await prisma.$transaction(async (tx) => {
      // Validate stock for variants
      for (const item of items) {
        if (item.variantId) {
          const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
          if (!variant) throw Object.assign(new Error(`Variante introuvable: ${item.variantId}`), { status: 400 });
          if (!variant.isAvailable || variant.stock < item.quantity) {
            throw Object.assign(
              new Error(`Stock insuffisant pour ${item.name} (taille ${item.size})`),
              { status: 400 }
            );
          }
        }
      }

      const orderNumber = await generateOrderNumber();

      // Create address
      const addr = await tx.address.create({
        data: {
          userId: req.user?.id || null,
          fullName,
          phone,
          email: email || null,
          governorate,
          city,
          address: addressLine,
        },
      });

      // Create order
      const created = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user?.id || null,
          guestName: req.user ? null : (guestName || fullName),
          guestPhone: req.user ? null : (guestPhone || phone),
          guestEmail: req.user ? null : (guestEmail || email || null),
          addressId: addr.id,
          paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
          status: 'PENDING',
          subtotal,
          deliveryFee,
          total,
          notes: notes || null,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              size: item.size,
              color: item.color || null,
              price: item.price,
              quantity: item.quantity,
            })),
          },
        },
        include: ORDER_INCLUDE,
      });

      return created;
    });

    return res.status(201).json({
      success: true,
      message: 'Commande créée avec succès',
      data: order,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ success: false, message: err.message });
    }
    next(err);
  }
}

export async function trackOrder(req, res, next) {
  try {
    const { orderNumber, phone } = req.query;

    if (!orderNumber || !phone) {
      return res.status(400).json({
        success: false,
        message: 'Numéro de commande et téléphone requis',
      });
    }

    const order = await prisma.order.findFirst({
      where: {
        orderNumber,
        address: { phone: { contains: phone.replace(/\s/g, '') } },
      },
      include: {
        address: true,
        items: { include: { product: { include: { images: { take: 1 } } } } },
        shipment: true,
      },
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrders(req, res, next) {
  try {
    const { page = '1', limit = '10' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const [total, orders] = await Promise.all([
      prisma.order.count({ where: { userId: req.user.id } }),
      prisma.order.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
        include: {
          address: true,
          items: { include: { product: { include: { images: { take: 1 } } } } },
          shipment: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function getMyOrderDetail(req, res, next) {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: ORDER_INCLUDE,
    });

    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function adminListOrders(req, res, next) {
  try {
    const { status, dateFrom, dateTo, governorate, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where = {};

    if (status) where.status = status;

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    if (governorate) where.address = { governorate: { contains: governorate, mode: 'insensitive' } };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search } },
        { address: { fullName: { contains: search, mode: 'insensitive' } } },
        { address: { phone: { contains: search } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          address: true,
          user: { select: { id: true, name: true, email: true } },
          _count: { select: { items: true } },
          shipment: true,
        },
      }),
    ]);

    return res.json({
      success: true,
      data: orders,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminGetOrder(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });
    return res.json({ success: true, data: order });
  } catch (err) {
    next(err);
  }
}

// Valid status transitions
const VALID_TRANSITIONS = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURNED'],
  DELIVERED: ['RETURNED'],
  CANCELLED: [],
  RETURNED: [],
};

export async function adminUpdateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { variant: true } } },
    });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition invalide: ${order.status} → ${status}`,
      });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Deduct stock on CONFIRMED
      if (status === 'CONFIRMED') {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { stock: { decrement: item.quantity } },
            });
          }
        }
      }

      // Restore stock on CANCELLED or RETURNED
      if (status === 'CANCELLED' || status === 'RETURNED') {
        // Only restore if previously confirmed (stock was deducted)
        const wasConfirmed = ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(order.status);
        if (wasConfirmed) {
          for (const item of order.items) {
            if (item.variantId) {
              await tx.productVariant.update({
                where: { id: item.variantId },
                data: { stock: { increment: item.quantity } },
              });
            }
          }
        }
      }

      return tx.order.update({
        where: { id },
        data: { status },
        include: ORDER_INCLUDE,
      });
    });

    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminAddShipment(req, res, next) {
  try {
    const { id } = req.params;
    const { company, trackingNumber, shippedAt, notes } = req.body;

    const shipment = await prisma.shipment.upsert({
      where: { orderId: id },
      update: {
        company,
        trackingNumber,
        shippedAt: shippedAt ? new Date(shippedAt) : null,
        notes: notes || null,
      },
      create: {
        orderId: id,
        company,
        trackingNumber,
        shippedAt: shippedAt ? new Date(shippedAt) : null,
        notes: notes || null,
      },
    });

    return res.json({ success: true, data: shipment });
  } catch (err) {
    next(err);
  }
}

export async function adminExportOrdersCSV(req, res, next) {
  try {
    const { status, dateFrom, dateTo } = req.query;
    const where = {};
    if (status) where.status = status;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }

    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { address: true, user: { select: { name: true } }, items: true },
    });

    const { ordersToCSV } = await import('../utils/csvExport.js');
    const csv = ordersToCSV(orders);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="commandes.csv"');
    return res.send('\uFEFF' + csv); // BOM for Excel
  } catch (err) {
    next(err);
  }
}

export async function adminGenerateOrderPDF(req, res, next) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return res.status(404).json({ success: false, message: 'Commande introuvable' });

    const PDFDocument = (await import('pdfkit')).default;
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="commande-${order.orderNumber}.pdf"`);
    doc.pipe(res);

    // Header
    doc.fontSize(22).font('Helvetica-Bold').text('LOCO Arts', { align: 'center' });
    doc.fontSize(10).font('Helvetica').text('Chaussures Artisanales Tunisiennes', { align: 'center' });
    doc.moveDown();
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Order info
    doc.fontSize(16).font('Helvetica-Bold').text(`BON DE COMMANDE`, { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica');
    doc.text(`N° Commande: ${order.orderNumber}`, { align: 'center' });
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('fr-TN')}`, { align: 'center' });
    doc.text(`Statut: ${order.status}`, { align: 'center' });
    doc.moveDown();

    // Client info
    doc.fontSize(13).font('Helvetica-Bold').text('Informations Client');
    doc.fontSize(11).font('Helvetica');
    const clientName = order.user?.name || order.guestName || order.address.fullName;
    doc.text(`Nom: ${clientName}`);
    doc.text(`Téléphone: ${order.address.phone}`);
    if (order.address.email) doc.text(`Email: ${order.address.email}`);
    doc.moveDown();

    // Delivery address
    doc.fontSize(13).font('Helvetica-Bold').text('Adresse de Livraison');
    doc.fontSize(11).font('Helvetica');
    doc.text(`${order.address.fullName}`);
    doc.text(`${order.address.address}`);
    doc.text(`${order.address.city}, ${order.address.governorate}`);
    doc.moveDown();

    // Items table header
    doc.fontSize(13).font('Helvetica-Bold').text('Articles Commandés');
    doc.moveDown(0.3);

    const tableTop = doc.y;
    const colX = { item: 50, size: 280, qty: 360, price: 420, total: 480 };

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Article', colX.item, tableTop);
    doc.text('Taille', colX.size, tableTop);
    doc.text('Qté', colX.qty, tableTop);
    doc.text('Prix', colX.price, tableTop);
    doc.text('Total', colX.total, tableTop);

    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();

    doc.font('Helvetica').fontSize(10);
    for (const item of order.items) {
      doc.moveDown(0.3);
      const y = doc.y;
      doc.text(`${item.name}${item.color ? ` (${item.color})` : ''}`, colX.item, y, { width: 220 });
      doc.text(item.size, colX.size, y);
      doc.text(String(item.quantity), colX.qty, y);
      doc.text(`${item.price.toFixed(2)} TND`, colX.price, y);
      doc.text(`${(item.price * item.quantity).toFixed(2)} TND`, colX.total, y);
      doc.moveDown(1.5);
    }

    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // Totals
    doc.fontSize(11);
    doc.text(`Sous-total: ${order.subtotal.toFixed(2)} TND`, { align: 'right' });
    doc.text(`Livraison: ${order.deliveryFee.toFixed(2)} TND`, { align: 'right' });
    doc.font('Helvetica-Bold').fontSize(13).text(`TOTAL: ${order.total.toFixed(2)} TND`, { align: 'right' });

    doc.moveDown();
    doc.font('Helvetica').fontSize(10).text(`Paiement: ${order.paymentMethod}`, { align: 'right' });

    if (order.notes) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Notes:');
      doc.font('Helvetica').text(order.notes);
    }

    // Shipment tracking
    if (order.shipment) {
      doc.moveDown();
      doc.font('Helvetica-Bold').text('Suivi Livraison:');
      doc.font('Helvetica').text(`Transporteur: ${order.shipment.company}`);
      doc.text(`N° Suivi: ${order.shipment.trackingNumber}`);
    }

    // Footer
    doc.moveDown(2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);
    doc.fontSize(9).font('Helvetica').text('Merci pour votre commande! | LOCO Arts - contact@LocoArts.tn', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}
