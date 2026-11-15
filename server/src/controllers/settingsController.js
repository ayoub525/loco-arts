import prisma from '../lib/prisma.js';

const PUBLIC_KEYS = [
  'shopName', 'shopEmail', 'shopPhone', 'shopAddress',
  'deliveryFee', 'freeShippingThreshold',
  'heroTitle', 'heroSubtitle',
  'currency', 'logoUrl',
  'facebookUrl', 'instagramUrl',
  'aboutText',
];

export async function getPublicSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: PUBLIC_KEYS } },
    });

    const result = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function adminGetSettings(req, res, next) {
  try {
    const settings = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const result = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function adminUpdateSettings(req, res, next) {
  try {
    const updates = req.body; // {key: value} or [{key, value}]

    const pairs = Array.isArray(updates)
      ? updates
      : Object.entries(updates).map(([key, value]) => ({ key, value: String(value) }));

    await Promise.all(
      pairs.map(({ key, value }) =>
        prisma.setting.upsert({
          where: { key },
          update: { value: String(value) },
          create: { key, value: String(value) },
        })
      )
    );

    const all = await prisma.setting.findMany({ orderBy: { key: 'asc' } });
    const result = all.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});

    return res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

export async function adminUploadLogo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Aucune image fournie' });
    }

    const logoUrl = `/uploads/misc/${req.file.filename}`;

    await prisma.setting.upsert({
      where: { key: 'logoUrl' },
      update: { value: logoUrl },
      create: { key: 'logoUrl', value: logoUrl },
    });

    return res.json({ success: true, data: { logoUrl } });
  } catch (err) {
    next(err);
  }
}
