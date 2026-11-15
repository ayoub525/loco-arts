import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '../utils/jwt.js';
import prisma from '../lib/prisma.js';

export async function authenticateToken(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res.status(401).json({ error: 'Authentification requise' });
    }

    const decoded = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true, phone: true, role: true },
    });

    if (!user) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Try refresh
      try {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
          return res.status(401).json({ error: 'Session expirée' });
        }
        const decoded = verifyRefreshToken(refreshToken);
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
          select: { id: true, email: true, name: true, phone: true, role: true },
        });
        if (!user) {
          return res.status(401).json({ error: 'Utilisateur non trouvé' });
        }
        const newAccessToken = signAccessToken({ userId: user.id, role: user.role });
        res.cookie('accessToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
          maxAge: 15 * 60 * 1000,
        });
        req.user = user;
        next();
      } catch {
        return res.status(401).json({ error: 'Session expirée, veuillez vous reconnecter' });
      }
    } else {
      return res.status(401).json({ error: 'Token invalide' });
    }
  }
}

export function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
  }
  next();
}

export async function optionalAuth(req, res, next) {
  try {
    const token = req.cookies?.accessToken;
    if (token) {
      const decoded = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, name: true, phone: true, role: true },
      });
      req.user = user || null;
    }
  } catch {
    req.user = null;
  }
  next();
}
