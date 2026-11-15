import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

router.get('/public', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const obj = {};
    settings.forEach((s) => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    next(err);
  }
});

export default router;
