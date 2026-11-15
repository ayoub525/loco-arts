import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Get wishlist
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            variants: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(wishlist);
  } catch (err) {
    next(err);
  }
});

// Add to wishlist
router.post('/:productId', authenticateToken, async (req, res, next) => {
  try {
    const existing = await prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId: req.user.id,
          productId: req.params.productId,
        },
      },
    });
    if (existing) {
      return res.json(existing);
    }
    const item = await prisma.wishlist.create({
      data: {
        userId: req.user.id,
        productId: req.params.productId,
      },
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
});

// Remove from wishlist
router.delete('/:productId', authenticateToken, async (req, res, next) => {
  try {
    await prisma.wishlist.deleteMany({
      where: {
        userId: req.user.id,
        productId: req.params.productId,
      },
    });
    res.json({ message: 'Retiré des favoris' });
  } catch (err) {
    next(err);
  }
});

export default router;
