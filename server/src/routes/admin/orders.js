import { Router } from 'express';
import prisma from '../../lib/prisma.js';
import { validate } from '../../middleware/validate.js';
import { statusUpdateSchema, shipmentSchema } from '../../schemas/index.js';
import { generateOrderPDF } from '../../utils/pdfGenerator.js';
import { ordersToCSV } from '../../utils/csvExport.js';

const router = Router();

// List orders with filters
router.get('/', async (req, res, next) => {
  try {
    const { status, dateFrom, dateTo, governorate, search, page = 1, limit = 20 } = req.query;
    const where = {};

    if (status) where.status = status;
    if (governorate) where.address = { governorate };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo + 'T23:59:59');
    }
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { guestName: { contains: search, mode: 'insensitive' } },
        { guestPhone: { contains: search, mode: 'insensitive' } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
        { user: { phone: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, phone: true } },
          address: true,
          items: true,
          shipment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// Export CSV
router.get('/export/csv', async (req, res, next) => {
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
      include: {
        user: { select: { name: true, email: true, phone: true } },
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const csv = ordersToCSV(orders);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=commandes.csv');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// Single order detail
router.get('/:id', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        address: true,
        items: {
          include: {
            product: { select: { slug: true } },
          },
        },
        shipment: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// Update order status
router.patch('/:id/status', validate(statusUpdateSchema), async (req, res, next) => {
  try {
    const { status } = req.body;
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const oldStatus = order.status;

    await prisma.$transaction(async (tx) => {
      // Deduct stock on CONFIRMED
      if (status === 'CONFIRMED' && oldStatus === 'PENDING') {
        for (const item of order.items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (!variant || variant.stock < item.quantity) {
              throw Object.assign(new Error(`Stock insuffisant pour ${item.name} (taille ${item.size})`), { statusCode: 400 });
            }
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { decrement: item.quantity },
                isAvailable: variant.stock - item.quantity > 0,
              },
            });
          }
        }
      }

      // Restore stock on CANCELLED or RETURNED (only if was confirmed+)
      if ((status === 'CANCELLED' || status === 'RETURNED') &&
          ['CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED'].includes(oldStatus)) {
        for (const item of order.items) {
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: {
                stock: { increment: item.quantity },
                isAvailable: true,
              },
            });
          }
        }
      }

      await tx.order.update({
        where: { id: req.params.id },
        data: { status },
      });
    });

    const updated = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: { items: true, address: true, shipment: true, user: { select: { name: true, email: true, phone: true } } },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Add/update shipment
router.post('/:id/shipment', validate(shipmentSchema), async (req, res, next) => {
  try {
    const { company, trackingNumber, shippedAt, notes } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const shipment = await prisma.shipment.upsert({
      where: { orderId: req.params.id },
      update: {
        company,
        trackingNumber,
        shippedAt: shippedAt ? new Date(shippedAt) : new Date(),
        notes,
      },
      create: {
        orderId: req.params.id,
        company,
        trackingNumber,
        shippedAt: shippedAt ? new Date(shippedAt) : new Date(),
        notes,
      },
    });
    res.json(shipment);
  } catch (err) {
    next(err);
  }
});

// Generate PDF
router.get('/:id/pdf', async (req, res, next) => {
  try {
    const order = await prisma.order.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true } },
        address: true,
        items: true,
        shipment: true,
      },
    });
    if (!order) return res.status(404).json({ error: 'Commande non trouvée' });

    const pdf = await generateOrderPDF(order);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=commande-${order.orderNumber}.pdf`);
    res.send(pdf);
  } catch (err) {
    next(err);
  }
});

export default router;
