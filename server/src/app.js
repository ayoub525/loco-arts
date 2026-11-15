import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import { authenticateToken, requireAdmin } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import orderRoutes from './routes/orders.js';
import wishlistRoutes from './routes/wishlist.js';
import contactRoutes from './routes/contact.js';
import settingsRoutes from './routes/settings.js';

// Admin routes
import adminDashboard from './routes/admin/dashboard.js';
import adminOrders from './routes/admin/orders.js';
import adminProducts from './routes/admin/products.js';
import adminCategories from './routes/admin/categories.js';
import adminCustomers from './routes/admin/customers.js';
import adminMessages from './routes/admin/messages.js';
import adminSettings from './routes/admin/settings.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Trop de requêtes, veuillez réessayer plus tard' },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: 'Trop de tentatives, veuillez réessayer plus tard' },
});

app.use(generalLimiter);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files (uploads)
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Public API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/settings', settingsRoutes);

// Admin API routes (all protected)
app.use('/api/admin/dashboard', authenticateToken, requireAdmin, adminDashboard);
app.use('/api/admin/orders', authenticateToken, requireAdmin, adminOrders);
app.use('/api/admin/products', authenticateToken, requireAdmin, adminProducts);
app.use('/api/admin/categories', authenticateToken, requireAdmin, adminCategories);
app.use('/api/admin/customers', authenticateToken, requireAdmin, adminCustomers);
app.use('/api/admin/messages', authenticateToken, requireAdmin, adminMessages);
app.use('/api/admin/settings', authenticateToken, requireAdmin, adminSettings);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Route non trouvée' });
});

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 LOCO Arts server running on http://localhost:${PORT}`);
});

export default app;
