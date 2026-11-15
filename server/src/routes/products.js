import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// Get all products with filters
router.get('/', async (req, res, next) => {
  try {
    const {
      category, size, color, minPrice, maxPrice,
      available, search, sort, page = 1, limit = 12,
    } = req.query;

    const where = { isActive: true };

    if (category) {
      where.category = { slug: category };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }
    if (size) {
      where.variants = { some: { size, isAvailable: true, stock: { gt: 0 } } };
    }
    if (color) {
      where.variants = {
        ...where.variants,
        some: { ...where.variants?.some, color: { contains: color, mode: 'insensitive' } },
      };
    }
    if (available === 'true') {
      where.variants = {
        ...where.variants,
        some: { ...where.variants?.some, isAvailable: true, stock: { gt: 0 } },
      };
    }

    let orderBy = { createdAt: 'desc' };
    if (sort === 'price_asc') orderBy = { price: 'asc' };
    if (sort === 'price_desc') orderBy = { price: 'desc' };
    if (sort === 'newest') orderBy = { createdAt: 'desc' };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 2 },
          variants: true,
          category: { select: { name: true, slug: true } },
        },
        orderBy,
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    next(err);
  }
});

// Featured
router.get('/featured', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
        category: { select: { name: true, slug: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// New arrivals
router.get('/new-arrivals', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
        category: { select: { name: true, slug: true } },
      },
      take: 8,
      orderBy: { createdAt: 'desc' },
    });
    res.json(products);
  } catch (err) {
    next(err);
  }
});

// Single product by slug
router.get('/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Produit non trouvé' });
    }

    // Get related products
    const related = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: true,
      },
      take: 4,
    });

    res.json({ product, related });
  } catch (err) {
    next(err);
  }
});

export default router;
