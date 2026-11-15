import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

// List categories
router.get('/', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

// Create category
router.post('/', async (req, res, next) => {
  try {
    const { name, slug, isActive } = req.body;
    const finalSlug = slug || name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const maxOrder = await prisma.category.aggregate({ _max: { sortOrder: true } });
    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        isActive: isActive !== false,
        sortOrder: (maxOrder._max.sortOrder || 0) + 1,
      },
    });
    res.status(201).json(category);
  } catch (err) {
    next(err);
  }
});

// Update category
router.put('/:id', async (req, res, next) => {
  try {
    const { name, slug, isActive } = req.body;
    const data = {};
    if (name !== undefined) data.name = name;
    if (slug !== undefined) data.slug = slug;
    if (isActive !== undefined) data.isActive = isActive;

    const category = await prisma.category.update({
      where: { id: req.params.id },
      data,
    });
    res.json(category);
  } catch (err) {
    next(err);
  }
});

// Delete category
router.delete('/:id', async (req, res, next) => {
  try {
    const productCount = await prisma.product.count({ where: { categoryId: req.params.id } });
    if (productCount > 0) {
      return res.status(400).json({ error: 'Impossible de supprimer une catégorie contenant des produits' });
    }
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Catégorie supprimée' });
  } catch (err) {
    next(err);
  }
});

// Reorder categories
router.patch('/reorder', async (req, res, next) => {
  try {
    const { items } = req.body; // [{id, sortOrder}]
    await Promise.all(
      items.map((item) =>
        prisma.category.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        })
      )
    );
    const categories = await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } });
    res.json(categories);
  } catch (err) {
    next(err);
  }
});

export default router;
