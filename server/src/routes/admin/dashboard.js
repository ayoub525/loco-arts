import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Today's orders
    const todayOrders = await prisma.order.count({
      where: { createdAt: { gte: startOfDay } },
    });

    // Total sales this month
    const monthOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: startOfMonth },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { total: true },
    });
    const totalSales = monthOrders.reduce((sum, o) => sum + o.total, 0);

    // Pending orders
    const pendingOrders = await prisma.order.count({
      where: { status: 'PENDING' },
    });

    // New messages
    const newMessages = await prisma.contactMessage.count({
      where: { isRead: false },
    });

    // Low stock (variants with stock < 5)
    const lowStock = await prisma.productVariant.findMany({
      where: { stock: { lt: 5, gt: 0 } },
      include: {
        product: { select: { name: true, slug: true } },
      },
      take: 10,
    });

    // Best sellers (top 5 by quantity sold)
    const bestSellers = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const bestSellerProducts = await Promise.all(
      bestSellers.map(async (bs) => {
        const product = await prisma.product.findUnique({
          where: { id: bs.productId },
          select: { name: true, slug: true, price: true },
        });
        return { ...product, totalSold: bs._sum.quantity };
      })
    );

    // Sales chart last 7 days
    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date(now);
      day.setDate(day.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const dayEnd = new Date(dayStart);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayOrders = await prisma.order.findMany({
        where: {
          createdAt: { gte: dayStart, lt: dayEnd },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        select: { total: true },
      });

      salesChart.push({
        date: dayStart.toISOString().slice(0, 10),
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }

    // Total customers
    const totalCustomers = await prisma.user.count({
      where: { role: 'CUSTOMER' },
    });

    // Total products
    const totalProducts = await prisma.product.count({
      where: { isActive: true },
    });

    res.json({
      todayOrders,
      totalSales,
      pendingOrders,
      newMessages,
      lowStock,
      bestSellers: bestSellerProducts,
      salesChart,
      totalCustomers,
      totalProducts,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
