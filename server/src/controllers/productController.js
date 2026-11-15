import prisma from '../lib/prisma.js';

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export async function listProducts(req, res, next) {
  try {
    const {
      category,
      size,
      color,
      minPrice,
      maxPrice,
      available,
      search,
      sort = 'newest',
      page = '1',
      limit = '12',
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

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

    if (size || color || available === 'true') {
      where.variants = {
        some: {
          ...(size ? { size } : {}),
          ...(color ? { color: { contains: color, mode: 'insensitive' } } : {}),
          ...(available === 'true' ? { isAvailable: true, stock: { gt: 0 } } : {}),
        },
      };
    }

    let orderBy;
    switch (sort) {
      case 'price-asc':
        orderBy = { price: 'asc' };
        break;
      case 'price-desc':
        orderBy = { price: 'desc' };
        break;
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limitNum,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          variants: { where: { isAvailable: true }, select: { size: true, color: true, stock: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeaturedProducts(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isAvailable: true }, select: { size: true, color: true, stock: true } },
      },
    });
    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

export async function getNewArrivals(req, res, next) {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isNew: true },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isAvailable: true }, select: { size: true, color: true, stock: true } },
      },
    });
    return res.json({ success: true, data: products });
  } catch (err) {
    next(err);
  }
}

export async function getProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await prisma.product.findUnique({
      where: { slug, isActive: true },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      },
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    // Related products (same category, different product)
    const related = await prisma.product.findMany({
      where: {
        isActive: true,
        categoryId: product.categoryId,
        id: { not: product.id },
      },
      take: 4,
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1 },
        variants: { where: { isAvailable: true }, select: { size: true, color: true, stock: true } },
      },
    });

    return res.json({ success: true, data: { ...product, related } });
  } catch (err) {
    next(err);
  }
}

// ─── Admin Controllers ─────────────────────────────────────────────────────

export async function adminListProducts(req, res, next) {
  try {
    const { search, category, isActive, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = { slug: category };
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          category: { select: { id: true, name: true, slug: true } },
          _count: { select: { variants: true, orderItems: true } },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: products,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminGetProduct(req, res, next) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        category: true,
        variants: { orderBy: [{ size: 'asc' }, { color: 'asc' }] },
      },
    });
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });
    return res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function adminCreateProduct(req, res, next) {
  try {
    let { name, slug, description, price, oldPrice, categoryId, isFeatured, isNew, isActive, variants } = req.body;

    price = parseFloat(price);
    oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    isFeatured = isFeatured === 'true' || isFeatured === true;
    isNew = isNew === 'true' || isNew === true;
    isActive = isActive === undefined ? true : isActive === 'true' || isActive === true;

    // Parse variants if sent as JSON string
    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch { variants = []; }
    }
    if (!variants) variants = [];

    const finalSlug = slug || slugify(name);

    const product = await prisma.product.create({
      data: {
        name,
        slug: finalSlug,
        description,
        price,
        oldPrice,
        categoryId,
        isFeatured: isFeatured || false,
        isNew: isNew !== false,
        isActive: isActive !== false,
        images: req.files?.length
          ? {
              create: req.files.map((f, i) => ({
                url: `/uploads/products/${f.filename}`,
                sortOrder: i,
              })),
            }
          : undefined,
        variants: variants.length
          ? {
              create: variants.map((v) => ({
                size: v.size,
                color: v.color || null,
                stock: parseInt(v.stock) || 0,
                isAvailable: v.isAvailable !== false,
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        variants: true,
        category: true,
      },
    });

    return res.status(201).json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateProduct(req, res, next) {
  try {
    const { id } = req.params;
    let { name, slug, description, price, oldPrice, categoryId, isFeatured, isNew, isActive, variants } = req.body;

    if (typeof variants === 'string') {
      try { variants = JSON.parse(variants); } catch { variants = undefined; }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (slug !== undefined) updateData.slug = slug;
    else if (name) updateData.slug = slugify(name);
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (oldPrice !== undefined) updateData.oldPrice = oldPrice ? parseFloat(oldPrice) : null;
    if (categoryId !== undefined) updateData.categoryId = categoryId;
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured === 'true' || isFeatured === true;
    if (isNew !== undefined) updateData.isNew = isNew === 'true' || isNew === true;
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;

    const product = await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({
        where: { id },
        data: updateData,
      });

      // Update variants if provided
      if (variants && Array.isArray(variants)) {
        // Delete old variants not in new list (by id)
        const incomingIds = variants.filter((v) => v.id).map((v) => v.id);
        await tx.productVariant.deleteMany({
          where: { productId: id, id: { notIn: incomingIds } },
        });

        for (const v of variants) {
          if (v.id) {
            await tx.productVariant.update({
              where: { id: v.id },
              data: {
                size: v.size,
                color: v.color || null,
                stock: parseInt(v.stock) || 0,
                isAvailable: v.isAvailable !== false,
              },
            });
          } else {
            await tx.productVariant.create({
              data: {
                productId: id,
                size: v.size,
                color: v.color || null,
                stock: parseInt(v.stock) || 0,
                isAvailable: v.isAvailable !== false,
              },
            });
          }
        }
      }

      return updated;
    });

    const full = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true, category: true },
    });

    return res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProduct(req, res, next) {
  try {
    const { id } = req.params;

    // Check if product has orders
    const orderCount = await prisma.orderItem.count({ where: { productId: id } });

    if (orderCount > 0) {
      // Soft delete
      await prisma.product.update({ where: { id }, data: { isActive: false } });
      return res.json({ success: true, message: 'Produit désactivé (a des commandes)' });
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ success: true, message: 'Produit supprimé' });
  } catch (err) {
    next(err);
  }
}

export async function adminDuplicateProduct(req, res, next) {
  try {
    const { id } = req.params;

    const original = await prisma.product.findUnique({
      where: { id },
      include: { images: true, variants: true },
    });
    if (!original) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    const baseSlug = `${original.slug}-copie`;
    let finalSlug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${counter++}`;
    }

    const duplicate = await prisma.product.create({
      data: {
        name: `${original.name} (Copie)`,
        slug: finalSlug,
        description: original.description,
        price: original.price,
        oldPrice: original.oldPrice,
        categoryId: original.categoryId,
        isFeatured: false,
        isNew: original.isNew,
        isActive: false,
        images: { create: original.images.map((img) => ({ url: img.url, sortOrder: img.sortOrder })) },
        variants: {
          create: original.variants.map((v) => ({
            size: v.size,
            color: v.color,
            stock: v.stock,
            isAvailable: v.isAvailable,
          })),
        },
      },
      include: { images: true, variants: true, category: true },
    });

    return res.status(201).json({ success: true, data: duplicate });
  } catch (err) {
    next(err);
  }
}

export async function adminToggleProductStatus(req, res, next) {
  try {
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ success: false, message: 'Produit introuvable' });

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: !product.isActive },
    });
    return res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteProductImage(req, res, next) {
  try {
    const { id, imageId } = req.params;
    await prisma.productImage.delete({ where: { id: imageId, productId: id } });
    return res.json({ success: true, message: 'Image supprimée' });
  } catch (err) {
    next(err);
  }
}

export async function adminAddProductImages(req, res, next) {
  try {
    const { id } = req.params;
    if (!req.files?.length) return res.status(400).json({ success: false, message: 'Aucune image fournie' });

    const existing = await prisma.productImage.count({ where: { productId: id } });
    const images = await prisma.productImage.createMany({
      data: req.files.map((f, i) => ({
        productId: id,
        url: `/uploads/products/${f.filename}`,
        sortOrder: existing + i,
      })),
    });

    const all = await prisma.productImage.findMany({ where: { productId: id }, orderBy: { sortOrder: 'asc' } });
    return res.json({ success: true, data: all });
  } catch (err) {
    next(err);
  }
}
