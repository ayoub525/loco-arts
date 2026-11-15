import { z } from 'zod';

export const contactSchema = z.object({
  name: z.string().min(2, 'Nom requis').max(100),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  phone: z.string().optional(),
  subject: z.string().max(200).optional(),
  body: z.string().min(10, 'Message minimum 10 caractères').max(2000),
});
