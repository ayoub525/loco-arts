import { z } from 'zod';

export const orderItemSchema = z.object({
  variantId: z.string().uuid('variantId invalide').optional(),
  productId: z.string().uuid('productId invalide'),
  name: z.string().min(1),
  size: z.string().min(1, 'Taille requise'),
  color: z.string().optional(),
  price: z.number().positive('Prix invalide'),
  quantity: z.number().int().positive('Quantité invalide'),
});

export const createOrderSchema = z.object({
  // Address
  fullName: z.string().min(2, 'Nom requis'),
  phone: z.string().min(8, 'Téléphone requis'),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  governorate: z.string().min(1, 'Gouvernorat requis'),
  city: z.string().min(1, 'Ville requise'),
  address: z.string().min(5, 'Adresse requise'),

  // Guest fields
  guestName: z.string().optional(),
  guestPhone: z.string().optional(),
  guestEmail: z.string().email().optional().or(z.literal('')),

  // Order
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'ONLINE']).default('CASH_ON_DELIVERY'),
  notes: z.string().max(500).optional(),
  items: z.array(orderItemSchema).min(1, 'Au moins un article requis'),
});

export const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']),
  notes: z.string().optional(),
});

export const shipmentSchema = z.object({
  company: z.string().min(1, 'Transporteur requis'),
  trackingNumber: z.string().min(1, 'Numéro de suivi requis'),
  shippedAt: z.string().optional(),
  notes: z.string().optional(),
});
