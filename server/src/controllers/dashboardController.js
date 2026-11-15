import prisma from '../lib/prisma.js';

export async function getDashboard(req, res, next) {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [
      todayOrders,
      pendingOrders,
      newMessages,
      monthlySalesAgg,
      lowStockVariants,
      bestSellerItems,
    ] = await Promise.all([
      // Today's order count
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),

      // Pending orders
      prisma.order.count({ where: { status: 'PENDING' } }),

      // Unread contact messages
      prisma.contactMessage.count({ where: { isRead: false } }),

      // Monthly total sales
      prisma.order.aggregate({
        where: {
          createdAt: { gte: startOfMonth },
          status: { notIn: ['CANCELLED', 'RETURNED'] },
        },
        _sum: { total: true },
      }),

      // Low stock variants (stock < 5)
      prisma.productVariant.findMany({
        where: { stock: { lt: 5 }, isAvailable: true },
        include: { product: { select: { id: true, name: true, slug: true } } },
        orderBy: { stock: 'asc' },
        take: 10,
      }),

      // Best sellers (top 5 products by quantity sold)
      prisma.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    // Enrich best sellers with product info
    const bestSellerProductIds = bestSellerItems.map((b) => b.productId);
    const bestSellerProducts = await prisma.product.findMany({
      where: { id: { in: bestSellerProductIds } },
      select: { id: true, name: true, slug: true, images: { take: 1 } },
    });
    const bestSellers = bestSellerItems.map((b) => ({
      product: bestSellerProducts.find((p) => p.id === b.productId) || null,
      totalSold: b._sum.quantity || 0,
    }));

    // Last 7 days sales chart
    const last7DaysOrders = await prisma.order.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
        status: { notIn: ['CANCELLED', 'RETURNED'] },
      },
      select: { createdAt: true, total: true },
    });

    const salesChart = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayOrders = last7DaysOrders.filter((o) => o.createdAt.toISOString().split('T')[0] === dateStr);
      salesChart.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
      });
    }

    return res.json({
      success: true,
      data: {
        todayOrders,
        pendingOrders,
        newMessages,
        totalSalesThisMonth: monthlySalesAgg._sum.total || 0,
        lowStock: lowStockVariants,
        bestSellers,
        salesChart,
      },
    });
  } catch (err) {
    next(err);
  }
}
