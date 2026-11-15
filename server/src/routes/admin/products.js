import { Router } from 'express';
import prisma from '../../lib/prisma.js';
import { uploadProducts } from '../../middleware/upload.js';

const router = Router();

// List all products (admin)
router.get('/', async (req, res, next) => {
  try {
    const { search, category, page = 1, limit = 20 } = req.query;
    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.categoryId = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          variants: true,
          category: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.product.count({ where }),
    ]);

    res.json({
      products,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) },
    });
  } catch (err) {
    next(err);
  }
});

// Get single product for editing
router.get('/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
        category: true,
      },
    });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Create product
router.post('/', uploadProducts, async (req, res, next) => {
  try {
    const { name, description, price, oldPrice, categoryId, isFeatured, isNew, isActive, variants } = req.body;

    // Generate slug
    const slug = name
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check slug uniqueness
    const existing = await prisma.product.findUnique({ where: { slug } });
    const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

    // Parse variants
    let parsedVariants = [];
    if (variants) {
      try { parsedVariants = JSON.parse(variants); } catch { parsedVariants = []; }
    }

    // Process images
    const images = (req.files || []).map((f, i) => ({
      url: `/uploads/products/${f.filename}`,
      sortOrder: i,
    }));

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description: description || null,
        price: parseFloat(price),
        oldPrice: oldPrice ? parseFloat(oldPrice) : null,
        categoryId,
        isFeatured: isFeatured === 'true' || isFeatured === true,
        isNew: isNew === 'true' || isNew === true || isNew === undefined,
        isActive: isActive === 'true' || isActive === true || isActive === undefined,
        images: { create: images },
        variants: {
          create: parsedVariants.map((v) => ({
            size: v.size,
            color: v.color || 'Noir',
            stock: parseInt(v.stock) || 0,
            isAvailable: parseInt(v.stock) > 0,
          })),
        },
      },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Update product
router.put('/:id', uploadProducts, async (req, res, next) => {
  try {
    const { name, description, price, oldPrice, categoryId, isFeatured, isNew, isActive, variants } = req.body;

    const updateData = {};
    if (name !== undefined) {
      updateData.name = name;
      const slug = name
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const existing = await prisma.product.findFirst({
        where: { slug, id: { not: req.params.id } },
      });
      updateData.slug = existing ? `${slug}-${Date.now()}` : slug;
    }
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (oldPrice !== undefined) updateData.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isNew !== undefined) updateData.isNew = isNew === 'true' || isNew === true;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    // Handle new uploaded images
    if (req.files && req.files.length > 0) {
      const existingImages = await prisma.productImage.count({ where: { productId: req.params.id } });
      const newImages = req.files.map((f, i) => ({
        productId: req.params.id,
        url: `/uploads/products/${f.filename}`,
        sortOrder: existingImages + i,
      }));
      await prisma.productImage.createMany({ data: newImages });
    }

    // Handle variants update
    if (variants) {
      let parsedVariants = [];
      try { parsedVariants = JSON.parse(variants); } catch { /* ignore */ }

      for (const v of parsedVariants) {
        if (v.id) {
          await prisma.productVariant.update({
            where: { id: v.id },
            data: {
              stock: parseInt(v.stock) || 0,
              isAvailable: v.isAvailable !== undefined ? v.isAvailable : parseInt(v.stock) > 0,
              color: v.color || undefined,
            },
          });
        } else {
          await prisma.productVariant.create({
            data: {
              productId: req.params.id,
              size: v.size,
              color: v.color || 'Noir',
              stock: parseInt(v.stock) || 0,
              isAvailable: parseInt(v.stock) > 0,
            },
          });
        }
      }
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { orderBy: { size: 'asc' } },
        category: true,
      },
    });

    res.json(product);
  } catch (err) {
    next(err);
  }
});

// Delete product
router.delete('/:id', async (req, res, next) => {
  try {
    const hasOrders = await prisma.orderItem.count({ where: { productId: req.params.id } });
    if (hasOrders > 0) {
      await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
      return res.json({ message: 'Produit masqué (des commandes y font référence)' });
    }
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    next(err);
  }
});

// Duplicate product
router.post('/:id/duplicate', async (req, res, next) => {
  try {
    const original = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { variants: true, images: true },
    });
    if (!original) return res.status(404).json({ error: 'Produit non trouvé' });

    const slug = `${original.slug}-copie-${Date.now()}`;
    const product = await prisma.product.create({
      data: {
        name: `${original.name} (Copie)`,
        slug,
        description: original.description,
        price: original.price,
        oldPrice: original.oldPrice,
        categoryId: original.categoryId,
        isFeatured: false,
        isNew: false,
        isActive: false,
        variants: {
          create: original.variants.map((v) => ({
            size: v.size,
            color: v.color,
            stock: 0,
            isAvailable: false,
          })),
        },
        images: {
          create: original.images.map((img) => ({
            url: img.url,
            sortOrder: img.sortOrder,
          })),
        },
      },
      include: { variants: true, images: true, category: true },
    });

    res.status(201).json(product);
  } catch (err) {
    next(err);
  }
});

// Toggle visibility
router.patch('/:id/toggle-status', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Produit non trouvé' });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: !product.isActive },
    });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete image
router.delete('/:id/images/:imageId', async (req, res, next) => {
  try {
    await prisma.productImage.delete({ where: { id: req.params.imageId } });
    res.json({ message: 'Image supprimée' });
  } catch (err) {
    next(err);
  }
});

// Add images to product
router.post('/:id/images', uploadProducts, async (req, res, next) => {
  try {
    const existingCount = await prisma.productImage.count({ where: { productId: req.params.id } });
    const images = (req.files || []).map((f, i) => ({
      productId: req.params.id,
      url: `/uploads/products/${f.filename}`,
      sortOrder: existingCount + i,
    }));
    await prisma.productImage.createMany({ data: images });
    const allImages = await prisma.productImage.findMany({
      where: { productId: req.params.id },
      orderBy: { sortOrder: 'asc' },
    });
    res.json(allImages);
  } catch (err) {
    next(err);
  }
});

export default router;
