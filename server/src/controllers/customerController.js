import prisma from '../lib/prisma.js';

export async function adminListCustomers(req, res, next) {
  try {
    const { search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [total, customers] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          _count: { select: { orders: true } },
          orders: {
            select: { total: true },
            where: { status: { notIn: ['CANCELLED', 'RETURNED'] } },
          },
        },
      }),
    ]);

    const enriched = customers.map((c) => ({
      ...c,
      orderCount: c._count.orders,
      totalSpent: c.orders.reduce((sum, o) => sum + o.total, 0),
      orders: undefined,
      _count: undefined,
    }));

    return res.json({
      success: true,
      data: enriched,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}
