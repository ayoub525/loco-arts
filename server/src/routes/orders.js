import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { orderSchema } from '../schemas/index.js';
import { generateOrderNumber } from '../utils/orderNumber.js';

const router = Router();

// Create order
router.post('/', optionalAuth, validate(orderSchema), async (req, res, next) => {
  try {
    const { fullName, phone, email, governorate, city, address, notes, paymentMethod, items } = req.body;

    // Get delivery fee from settings
    const deliverySetting = await prisma.setting.findUnique({ where: { key: 'deliveryFee' } });
    const freeThresholdSetting = await prisma.setting.findUnique({ where: { key: 'freeShippingThreshold' } });
    const baseFee = deliverySetting ? parseFloat(deliverySetting.value) : 8;
    const freeThreshold = freeThresholdSetting ? parseFloat(freeThresholdSetting.value) : 200;

    const result = await prisma.$transaction(async (tx) => {
      // Validate variants and calculate subtotal
      let subtotal = 0;
      const orderItems = [];

      for (const item of items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
          include: { product: true },
        });

        if (!variant) {
          throw Object.assign(new Error(`Variante non trouvée: ${item.variantId}`), { statusCode: 400 });
        }
        if (!variant.isAvailable || variant.stock < item.quantity) {
          throw Object.assign(
            new Error(`Stock insuffisant pour ${variant.product.name} (taille ${variant.size})`),
            { statusCode: 400 }
          );
        }

        subtotal += variant.product.price * item.quantity;
        orderItems.push({
          variantId: variant.id,
          productId: variant.productId,
          name: variant.product.name,
          size: variant.size,
          color: variant.color || '',
          price: variant.product.price,
          quantity: item.quantity,
        });
      }

      const deliveryFee = subtotal >= freeThreshold ? 0 : baseFee;
      const total = subtotal + deliveryFee;

      // Create address
      const addr = await tx.address.create({
        data: {
          userId: req.user?.id || null,
          fullName,
          phone,
          email: email || null,
          governorate,
          city,
          address,
        },
      });

      // Generate order number
      const orderNumber = await generateOrderNumber();

      // Create order
      const order = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user?.id || null,
          guestName: req.user ? null : fullName,
          guestPhone: req.user ? null : phone,
          guestEmail: req.user ? null : (email || null),
          addressId: addr.id,
          status: 'PENDING',
          paymentMethod: paymentMethod || 'CASH_ON_DELIVERY',
          deliveryFee,
          subtotal,
          total,
          notes: notes || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      return order;
    });

    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

// Track order (public)
router.get('/track', async (req, res, next) => {
  try {
    const { orderNumber, phone } = req.query;
    if (!orderNumber || !phone) {
      return res.status(400).json({ error: 'Numéro de commande et téléphone requis' });
    }

    const order = await prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: true,
        address: true,
        shipment: true,
        user: { select: { phone: true } },
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    // Verify phone
    const orderPhone = order.guestPhone || order.user?.phone || order.address?.phone;
    const cleanPhone = (p) => (p || '').replace(/[\s\-\+]/g, '').slice(-8);
    if (cleanPhone(orderPhone) !== cleanPhone(phone)) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({
      orderNumber: order.orderNumber,
      status: order.status,
      createdAt: order.createdAt,
      total: order.total,
      items: order.items.map((i) => ({ name: i.name, size: i.size, color: i.color, quantity: i.quantity, price: i.price })),
      shipment: order.shipment ? {
        company: order.shipment.company,
        trackingNumber: order.shipment.trackingNumber,
        shippedAt: order.shipment.shippedAt,
      } : null,
    });
  } catch (err) {
    next(err);
  }
});

// My orders (authenticated)
router.get('/my', authenticateToken, async (req, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: true,
        shipment: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (err) {
    next(err);
  }
});

// My single order
router.get('/my/:id', authenticateToken, async (req, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: {
        items: true,
        address: true,
        shipment: true,
      },
    });
    if (!order) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    res.json(order);
  } catch (err) {
    next(err);
  }
});

export default router;
