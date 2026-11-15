import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import AdminLayout from './components/layout/AdminLayout';

// Public pages
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import TrackOrder from './pages/TrackOrder';

// Auth & Customer account
import Login from './pages/Account/Login';
import Register from './pages/Account/Register';
import Profile from './pages/Account/Profile';
import MyOrders from './pages/Account/MyOrders';
import OrderDetail from './pages/Account/OrderDetail';

// Static pages
import About from './pages/Static/About';
import Contact from './pages/Static/Contact';
import Shipping from './pages/Static/Shipping';
import FAQ from './pages/Static/FAQ';
import NotFound from './pages/NotFound';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminOrders from './pages/admin/AdminOrders';
import AdminOrderDetail from './pages/admin/AdminOrderDetail';
import AdminProducts from './pages/admin/AdminProducts';
import AdminProductForm from './pages/admin/AdminProductForm';
import AdminCategories from './pages/admin/AdminCategories';
import AdminCustomers from './pages/admin/AdminCustomers';
import AdminMessages from './pages/admin/AdminMessages';
import AdminSettings from './pages/admin/AdminSettings';

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-heading text-lg">
        Chargement...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/connexion" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Admin Panel (protected) */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="commandes" element={<AdminOrders />} />
        <Route path="commandes/:id" element={<AdminOrderDetail />} />
        <Route path="produits" element={<AdminProducts />} />
        <Route path="produits/nouveau" element={<AdminProductForm />} />
        <Route path="produits/:id/modifier" element={<AdminProductForm />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="clients" element={<AdminCustomers />} />
        <Route path="messages" element={<AdminMessages />} />
        <Route path="parametres" element={<AdminSettings />} />
      </Route>

      {/* Public Storefront with Header & Footer */}
      <Route
        path="*"
        element={
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/boutique" element={<Shop />} />
                <Route path="/produit/:slug" element={<ProductDetail />} />
                <Route path="/panier" element={<Cart />} />
                <Route path="/commande" element={<Checkout />} />
                <Route path="/confirmation/:orderNumber" element={<OrderConfirmation />} />
                <Route path="/suivre-commande" element={<TrackOrder />} />

                {/* Account */}
                <Route path="/connexion" element={<Login />} />
                <Route path="/inscription" element={<Register />} />
                <Route
                  path="/compte/profil"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/compte/commandes"
                  element={
                    <ProtectedRoute>
                      <MyOrders />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/compte/commandes/:id"
                  element={
                    <ProtectedRoute>
                      <OrderDetail />
                    </ProtectedRoute>
                  }
                />

                {/* Static */}
                <Route path="/sur-nous" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/livraison-retours" element={<Shipping />} />
                <Route path="/faq" element={<FAQ />} />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        }
      />
    </Routes>
  );
}
