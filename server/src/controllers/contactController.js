import prisma from '../lib/prisma.js';

export async function createContactMessage(req, res, next) {
  try {
    const { name, email, phone, subject, body } = req.body;

    const message = await prisma.contactMessage.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        subject: subject || null,
        body,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès. Nous vous répondrons sous 24h.',
      data: { id: message.id },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminListMessages(req, res, next) {
  try {
    const { isRead, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (isRead !== undefined) where.isRead = isRead === 'true';

    const [total, messages] = await Promise.all([
      prisma.contactMessage.count({ where }),
      prisma.contactMessage.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return res.json({
      success: true,
      data: messages,
      pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) },
    });
  } catch (err) {
    next(err);
  }
}

export async function adminMarkMessageRead(req, res, next) {
  try {
    const message = await prisma.contactMessage.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    return res.json({ success: true, data: message });
  } catch (err) {
    next(err);
  }
}

export async function adminDeleteMessage(req, res, next) {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    return res.json({ success: true, message: 'Message supprimé' });
  } catch (err) {
    next(err);
  }
}
