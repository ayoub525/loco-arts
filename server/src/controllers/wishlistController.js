import prisma from '../lib/prisma.js';

export async function getWishlist(req, res, next) {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user.id },
      include: {
        product: {
          include: {
            images: { orderBy: { sortOrder: 'asc' }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
            variants: { where: { isAvailable: true }, select: { size: true, color: true, stock: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.json({ success: true, data: wishlist });
  } catch (err) {
    next(err);
  }
}

export async function addToWishlist(req, res, next) {
  try {
    const { productId } = req.params;

    const product = await prisma.product.findUnique({ where: { id: productId, isActive: true } });
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    if (existing) {
      return res.status(409).json({ success: false, message: 'Déjà dans la wishlist' });
    }

    const item = await prisma.wishlist.create({
      data: { userId: req.user.id, productId },
      include: { product: { include: { images: { take: 1 } } } },
    });

    return res.status(201).json({ success: true, data: item });
  } catch (err) {
    next(err);
  }
}

export async function removeFromWishlist(req, res, next) {
  try {
    const { productId } = req.params;

    await prisma.wishlist.delete({
      where: { userId_productId: { userId: req.user.id, productId } },
    });

    return res.json({ success: true, message: 'Retiré de la wishlist' });
  } catch (err) {
    next(err);
  }
}
