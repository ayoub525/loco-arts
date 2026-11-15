import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
