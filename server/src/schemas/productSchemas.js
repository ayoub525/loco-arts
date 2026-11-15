import { z } from 'zod';

export const variantSchema = z.object({
  size: z.string().min(1),
  color: z.string().optional(),
  stock: z.number().int().nonnegative().default(0),
  isAvailable: z.boolean().default(true),
});

export const createProductSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(255),
  slug: z.string().min(2).max(255).optional(),
  description: z.string().optional(),
  price: z.number().positive('Prix invalide'),
  oldPrice: z.number().positive().optional().nullable(),
  categoryId: z.string().uuid('Catégorie invalide'),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),
  variants: z.array(variantSchema).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const categorySchema = z.object({
  name: z.string().min(1, 'Nom requis').max(100),
  slug: z.string().min(1).max(100).optional(),
  imageUrl: z.string().url().optional().nullable(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

export const reorderCategoriesSchema = z.array(
  z.object({
    id: z.string().uuid(),
    sortOrder: z.number().int(),
  })
);
