import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.js';

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
};

function setTokenCookies(res, user) {
  const payload = { id: user.id, email: user.email, role: user.role, name: user.name };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken({ id: user.id });

  res.cookie('accessToken', accessToken, { ...COOKIE_OPTS, maxAge: 15 * 60 * 1000 }); // 15 min
  res.cookie('refreshToken', refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days
}

export async function register(req, res, next) {
  try {
    const { email, password, name, phone } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, passwordHash, name, phone, role: 'CUSTOMER' },
    });

    setTokenCookies(res, user);

    return res.status(201).json({
      success: true,
      message: 'Compte créé avec succès',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    }

    setTokenCookies(res, user);

    return res.json({
      success: true,
      message: 'Connexion réussie',
      user: { id: user.id, email: user.email, name: user.name, role: user.role, phone: user.phone },
    });
  } catch (err) {
    next(err);
  }
}

export async function logout(req, res) {
  res.clearCookie('accessToken', COOKIE_OPTS);
  res.clearCookie('refreshToken', COOKIE_OPTS);
  return res.json({ success: true, message: 'Déconnecté avec succès' });
}

export async function me(req, res, next) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, email: true, name: true, phone: true, role: true, createdAt: true },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    return res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Refresh token manquant' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalide' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Utilisateur introuvable' });
    }

    setTokenCookies(res, user);

    return res.json({
      success: true,
      message: 'Token renouvelé',
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}
