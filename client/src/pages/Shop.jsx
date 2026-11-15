import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import ProductCard from '../components/product/ProductCard';
import { ProductCardSkeleton } from '../components/ui/Skeleton';

export default function Shop() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories').then(r => r.data),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['products', category, sort, page, search],
    queryFn: () => api.get('/products', {
      params: { category, sort, page, limit: 12, search: search || undefined },
    }).then(r => r.data),
  });

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setSearchParams(params);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    updateParam('search', search);
  };

  return (
    <div className="container-custom section-padding">
      <h1 className="font-heading font-black text-4xl md:text-5xl mb-8">{t('shop.title')}</h1>

      {/* Search & Sort bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('shop.search')}
              className="w-full border border-gray-200 px-4 py-3 pr-10 font-body text-sm focus:outline-none focus:border-black transition-colors"
            />
            <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        <div className="flex gap-4">
          <button onClick={() => setFiltersOpen(!filtersOpen)} className="md:hidden btn-secondary text-sm py-2 px-4">
            {t('shop.filters')}
          </button>
          <select
            value={sort}
            onChange={(e) => updateParam('sort', e.target.value)}
            className="border border-gray-200 px-4 py-3 text-sm font-body focus:outline-none focus:border-black"
          >
            <option value="newest">{t('shop.newest')}</option>
            <option value="price_asc">{t('shop.priceAsc')}</option>
            <option value="price_desc">{t('shop.priceDesc')}</option>
          </select>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Filters sidebar */}
        <aside className={`w-56 flex-shrink-0 ${filtersOpen ? 'block' : 'hidden'} md:block`}>
          <div className="sticky top-28">
            <h3 className="font-heading font-bold text-sm uppercase tracking-widest mb-4">{t('shop.category')}</h3>
            <ul className="space-y-2 mb-8">
              <li>
                <button
                  onClick={() => updateParam('category', '')}
                  className={`text-sm ${!category ? 'font-bold text-black' : 'text-gray-500 hover:text-black'} transition-colors`}
                >
                  {t('shop.allCategories')}
                </button>
              </li>
              {(categories || []).map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => updateParam('category', cat.slug)}
                    className={`text-sm ${category === cat.slug ? 'font-bold text-black' : 'text-gray-500 hover:text-black'} transition-colors`}
                  >
                    {cat.name} ({cat._count?.products || 0})
                  </button>
                </li>
              ))}
            </ul>

            {(category || search) && (
              <button
                onClick={() => { setSearch(''); setSearchParams({}); }}
                className="text-sm text-gray-500 hover:text-black underline"
              >
                {t('shop.clearFilters')}
              </button>
            )}
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {data?.pagination && (
            <p className="text-sm text-gray-500 mb-6">{t('shop.results', { count: data.pagination.total })}</p>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : data?.products?.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {data.products.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center mt-12 gap-2">
                  {Array.from({ length: data.pagination.pages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => updateParam('page', String(i + 1))}
                      className={`w-10 h-10 text-sm font-heading font-semibold transition-colors ${
                        page === i + 1 ? 'bg-black text-white' : 'border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">{t('shop.noProducts')}</p>
              <Link to="/boutique" className="btn-primary mt-6 inline-block">{t('shop.clearFilters')}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
