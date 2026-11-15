import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import logo from '../../assets/logo.png';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <>
      {/* Top bar */}
      <div className="bg-black text-white text-xs text-center py-2 font-body tracking-wide">
        {t('home.freeShipping', { threshold: '200' })}
      </div>

      {/* Main nav */}
      <nav className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white shadow-sm' : 'bg-white'}`}>
        <div className="container-custom flex items-center justify-between h-16 md:h-20">
          {/* Mobile menu button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2" aria-label="Menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={logo} alt="LOCO Arts" className="h-10 md:h-12 object-contain" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} />
            <span className="hidden font-heading font-black text-2xl tracking-tight">LOCO <span className="font-light italic">arts</span></span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="font-heading text-sm uppercase tracking-widest hover:text-gray-600 transition-colors">{t('nav.home')}</Link>
            <Link to="/boutique" className="font-heading text-sm uppercase tracking-widest hover:text-gray-600 transition-colors">{t('nav.shop')}</Link>
            <Link to="/sur-nous" className="font-heading text-sm uppercase tracking-widest hover:text-gray-600 transition-colors">{t('nav.about')}</Link>
            <Link to="/contact" className="font-heading text-sm uppercase tracking-widest hover:text-gray-600 transition-colors">{t('nav.contact')}</Link>
          </div>

          {/* Icons */}
          <div className="flex items-center space-x-4">
            {/* Wishlist */}
            <Link to={user ? '/compte/favoris' : '/connexion'} className="hidden sm:block hover:text-gray-600 transition-colors" title={t('nav.wishlist')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            {/* Cart */}
            <Link to="/panier" className="relative hover:text-gray-600 transition-colors" title={t('nav.cart')}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative group">
                <button className="hover:text-gray-600 transition-colors p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold truncate">{user.name}</p>
                    <p className="text-xs text-gray-500 truncate">{user.email}</p>
                  </div>
                  {user.role === 'ADMIN' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm hover:bg-gray-50">{t('nav.admin')}</Link>
                  )}
                  <Link to="/compte/commandes" className="block px-4 py-2 text-sm hover:bg-gray-50">{t('auth.myOrders')}</Link>
                  <Link to="/suivre-commande" className="block px-4 py-2 text-sm hover:bg-gray-50">{t('nav.trackOrder')}</Link>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-red-600">{t('nav.logout')}</button>
                </div>
              </div>
            ) : (
              <Link to="/connexion" className="hover:text-gray-600 transition-colors" title={t('nav.login')}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </Link>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-200 animate-fade-in">
            <div className="container-custom py-4 space-y-3">
              <Link to="/" onClick={() => setMenuOpen(false)} className="block font-heading text-sm uppercase tracking-widest py-2">{t('nav.home')}</Link>
              <Link to="/boutique" onClick={() => setMenuOpen(false)} className="block font-heading text-sm uppercase tracking-widest py-2">{t('nav.shop')}</Link>
              <Link to="/sur-nous" onClick={() => setMenuOpen(false)} className="block font-heading text-sm uppercase tracking-widest py-2">{t('nav.about')}</Link>
              <Link to="/contact" onClick={() => setMenuOpen(false)} className="block font-heading text-sm uppercase tracking-widest py-2">{t('nav.contact')}</Link>
              <Link to="/suivre-commande" onClick={() => setMenuOpen(false)} className="block font-heading text-sm uppercase tracking-widest py-2">{t('nav.trackOrder')}</Link>
              {!user && (
                <Link to="/connexion" onClick={() => setMenuOpen(false)} className="block btn-primary text-center mt-4">{t('nav.login')}</Link>
              )}
            </div>
          </div>
        )}
      </nav>
    </>
  );
}
