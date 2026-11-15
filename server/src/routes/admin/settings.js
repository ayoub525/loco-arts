import { Router } from 'express';
import prisma from '../../lib/prisma.js';
import { uploadSingle, setUploadPath } from '../../middleware/upload.js';

const router = Router();

// Get all settings
router.get('/', async (req, res, next) => {
  try {
    const settings = await prisma.setting.findMany();
    const obj = {};
    settings.forEach((s) => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    next(err);
  }
});

// Update settings
router.put('/', async (req, res, next) => {
  try {
    const entries = Object.entries(req.body);
    for (const [key, value] of entries) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    const settings = await prisma.setting.findMany();
    const obj = {};
    settings.forEach((s) => { obj[s.key] = s.value; });
    res.json(obj);
  } catch (err) {
    next(err);
  }
});

// Upload logo
router.post('/logo', setUploadPath('uploads/misc'), uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier' });
    }
    const url = `/uploads/misc/${req.file.filename}`;
    await prisma.setting.upsert({
      where: { key: 'logoUrl' },
      update: { value: url },
      create: { key: 'logoUrl', value: url },
    });
    res.json({ url });
  } catch (err) {
    next(err);
  }
});

export default router;
