import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { validate } from '../middleware/validate.js';
import { contactSchema } from '../schemas/index.js';

const router = Router();

router.post('/', validate(contactSchema), async (req, res, next) => {
  try {
    const message = await prisma.contactMessage.create({
      data: req.body,
    });
    res.status(201).json({ message: 'Message envoyé avec succès', id: message.id });
  } catch (err) {
    next(err);
  }
});

export default router;
