import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

export default function Home() {
  const { t } = useTranslation();

  const { data: featured, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-products'],
    queryFn: () => api.get('/products/featured').then(r => r.data),
  });

  const { data: newArrivals, isLoading: loadingNew } = useQuery({
    queryKey: ['new-arrivals'],
    queryFn: () => api.get('/products/new-arrivals').then(r => r.data),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  return (
    <div>
      {/* HERO SECTION */}
      <section className="min-h-[90vh] flex items-center bg-white">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-16">
          <div className="animate-slide-up">
            <p className="font-heading text-sm uppercase tracking-[0.3em] text-gray-500 mb-4">CR.EATIVE STUDIO · TUNIS</p>
            <h1 className="font-heading font-black text-5xl md:text-7xl leading-[0.95] mb-6">
              {t('home.heroTitle')}
            </h1>
            <p className="text-gray-600 text-lg mb-8 max-w-md font-body">
              {t('home.heroSubtitle')}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/boutique" className="btn-primary">{t('home.shopNow')}</Link>
              <Link to="/boutique?category=personnalise" className="btn-secondary">{t('home.customOrders')}</Link>
            </div>
          </div>
          <div className="animate-fade-in">
            {/* PLACEHOLDER: Remplacez par votre photo hero (ex: photo de chaussures artisanales) */}
            <div className="aspect-[3/4] bg-gray-100 flex items-center justify-center">
              <span className="text-gray-400 text-sm">📷 Photo Hero</span>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PRODUCTS */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-center mb-12">{t('home.featured')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {loadingFeatured
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : featured?.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)
            }
          </div>
          <div className="text-center mt-10">
            <Link to="/boutique" className="btn-secondary">{t('home.shopNow')}</Link>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-center mb-12">{t('home.categories')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {(categories || []).map((cat) => (
              <Link key={cat.id} to={`/boutique?category=${cat.slug}`} className="group relative aspect-[3/4] bg-gray-200 overflow-hidden">
                {/* PLACEHOLDER: Remplacez par photo de catégorie */}
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors duration-300" />
                <div className="absolute inset-0 flex items-end p-6">
                  <h3 className="font-heading font-bold text-white text-xl uppercase tracking-wide">{cat.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      {newArrivals?.length > 0 && (
        <section className="section-padding bg-white">
          <div className="container-custom">
            <h2 className="font-heading font-black text-3xl md:text-4xl text-center mb-12">{t('home.newArrivals')}</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {loadingNew
                ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
                : newArrivals?.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* BRAND STORY */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-heading font-black text-3xl md:text-4xl mb-6">{t('home.brandStoryTitle')}</h2>
            <p className="text-gray-600 leading-relaxed mb-6">{t('home.brandStory')}</p>
            <p className="font-heading font-bold text-lg">{t('home.madeWith')}</p>
          </div>
          <div>
            {/* PLACEHOLDER: Remplacez par photo d'atelier / équipe */}
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
              <span className="text-gray-400 text-sm">📷 Photo Atelier</span>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section-padding bg-black text-white">
        <div className="container-custom">
          <h2 className="font-heading font-black text-3xl md:text-4xl text-center mb-12">{t('home.servicesTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: t('home.customArts'), desc: t('home.customArtsDesc'), icon: '🎨' },
              { title: t('home.renovation'), desc: t('home.renovationDesc'), icon: '✨' },
              { title: t('home.repair'), desc: t('home.repairDesc'), icon: '🔧' },
            ].map((s, i) => (
              <div key={i} className="border border-gray-700 p-8 hover:border-white transition-colors duration-300">
                <span className="text-4xl mb-4 block">{s.icon}</span>
                <h3 className="font-heading font-bold text-xl mb-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
