import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  phone: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
});

export const orderSchema = z.object({
  fullName: z.string().min(2, 'Le nom est requis'),
  phone: z.string().min(8, 'Numéro de téléphone invalide'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  governorate: z.string().min(2, 'Le gouvernorat est requis'),
  city: z.string().min(2, 'La ville est requise'),
  address: z.string().min(5, "L'adresse est requise"),
  notes: z.string().optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'ONLINE']).default('CASH_ON_DELIVERY'),
  items: z.array(z.object({
    variantId: z.string(),
    productId: z.string(),
    quantity: z.number().int().min(1).max(10),
  })).min(1, 'Le panier est vide'),
});

export const contactSchema = z.object({
  name: z.string().min(2, 'Le nom est requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  subject: z.string().optional(),
  body: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

export const productSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  oldPrice: z.number().positive().optional().nullable(),
  categoryId: z.string(),
  isFeatured: z.boolean().default(false),
  isNew: z.boolean().default(true),
  isActive: z.boolean().default(true),
  variants: z.string().optional(), // JSON string of variants array
});

export const categorySchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
  isActive: z.boolean().default(true),
});

export const shipmentSchema = z.object({
  company: z.string().min(1),
  trackingNumber: z.string().min(1),
  shippedAt: z.string().optional(),
  notes: z.string().optional(),
});

export const statusUpdateSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  note: z.string().optional(),
});
