import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import prisma from '../lib/prisma.js';
import { signAccessToken, signRefreshToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { registerSchema, loginSchema } from '../schemas/index.js';
import { sendResetPasswordEmail } from '../utils/emailService.js';

const router = Router();

const cookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
});

// Register
router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Cet email est déjà utilisé' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash, phone, role: 'CUSTOMER' },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// Login
router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: 'insensitive' } }
    });
    if (!user) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const accessToken = signAccessToken({ userId: user.id, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, role: user.role });
    res.cookie('accessToken', accessToken, cookieOptions(15 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, cookieOptions(7 * 24 * 60 * 60 * 1000));
    res.json({
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

// Logout
router.post('/logout', (req, res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
  res.json({ message: 'Déconnecté' });
});

// Me
router.get('/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Forgot password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Adresse email requise' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if user exists by email
    let user = await prisma.user.findFirst({
      where: { email: { equals: cleanEmail, mode: 'insensitive' } },
    });

    // Special handler if requested email is ayoubferchichi88@gmail.com and user is admin
    if (!user && cleanEmail === 'ayoubferchichi88@gmail.com') {
      user = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    }

    if (!user) {
      return res.status(404).json({ error: 'Aucun compte associé à cette adresse email' });
    }

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpires: expires,
      },
    });

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl.replace(/\/$/, '')}/reinitialiser-mot-de-passe?token=${token}&email=${encodeURIComponent(user.email)}`;

    // If user is admin or requested email is ayoubferchichi88@gmail.com, send to ayoubferchichi88@gmail.com
    const destinationEmail = (user.role === 'ADMIN' || cleanEmail === 'ayoubferchichi88@gmail.com')
      ? 'ayoubferchichi88@gmail.com'
      : user.email;

    const emailResult = await sendResetPasswordEmail(destinationEmail, resetUrl);

    res.json({
      message: `Un email de réinitialisation a été envoyé à ${destinationEmail}`,
      resetUrl: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
      simulated: emailResult?.simulated,
    });
  } catch (err) {
    next(err);
  }
});

// Reset password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
      return res.status(400).json({ error: 'Informations incomplètes' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 6 caractères' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = await prisma.user.findFirst({
      where: {
        email: { equals: cleanEmail, mode: 'insensitive' },
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'Lien de réinitialisation invalide ou expiré' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    res.json({ message: 'Votre mot de passe a été réinitialisé avec succès !' });
  } catch (err) {
    next(err);
  }
});

export default router;
