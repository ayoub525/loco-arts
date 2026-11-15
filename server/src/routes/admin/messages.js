import { Router } from 'express';
import prisma from '../../lib/prisma.js';

const router = Router();

// List messages
router.get('/', async (req, res, next) => {
  try {
    const messages = await prisma.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(messages);
  } catch (err) {
    next(err);
  }
});

// Mark as read
router.patch('/:id/read', async (req, res, next) => {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json(message);
  } catch (err) {
    next(err);
  }
});

// Delete message
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.json({ message: 'Message supprimé' });
  } catch (err) {
    next(err);
  }
});

export default router;
