import prisma from '../lib/prisma.js';

export async function listCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function adminListCategories(req, res, next) {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    return res.json({ success: true, data: categories });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateCategory(req, res, next) {
  try {
    const { name, slug, imageUrl, sortOrder, isActive } = req.body;

    const finalSlug = slug || name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-');

    const category = await prisma.category.create({
      data: {
        name,
        slug: finalSlug,
        imageUrl: imageUrl || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== false,
      },
    });

    return res.status(201).json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateCategory(req, res, next) {
  try {
    const { id } = req.params;
    const { name, slug, imageUrl, sortOrder, isActive } = req.body;

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(slug !== undefined && { slug }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return res.json({ success: true, data: category });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteCategory(req, res, next) {
  try {
    const { id } = req.params;

    const productCount = await prisma.product.count({ where: { categoryId: id } });
    if (productCount > 0) {
      return res.status(409).json({
        success: false,
        message: `Impossible de supprimer: ${productCount} produit(s) associé(s)`,
      });
    }

    await prisma.category.delete({ where: { id } });
    return res.json({ success: true, message: 'Catégorie supprimée' });
  } catch (err) {
    next(err);
  }
}

export async function adminReorderCategories(req, res, next) {
  try {
    const items = req.body; // [{id, sortOrder}]

    await Promise.all(
      items.map(({ id, sortOrder }) =>
        prisma.category.update({ where: { id }, data: { sortOrder } })
      )
    );

    return res.json({ success: true, message: 'Ordre mis à jour' });
  } catch (err) {
    next(err);
  }
}
