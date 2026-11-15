import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/axios';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/product/ProductCard';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';

export default function ProductDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.get(`/products/${slug}`).then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const { product, related } = data || {};
  if (!product) return <div className="container-custom section-padding text-center"><p>{t('shop.noProducts')}</p></div>;

  const colors = [...new Set(product.variants.map(v => v.color).filter(Boolean))];
  const hasStock = product.variants.some(v => v.isAvailable && v.stock > 0);
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;

  const getVariant = () => {
    return product.variants.find(v =>
      v.size === selectedSize && (!selectedColor || v.color === selectedColor)
    );
  };

  const handleAddToCart = () => {
    const variant = getVariant();
    if (!variant) return;
    addToCart(product, variant, quantity);
  };

  return (
    <div className="container-custom section-padding">
      {/* Breadcrumb */}
      <nav className="flex items-center text-sm text-gray-500 mb-8 space-x-2">
        <Link to="/" className="hover:text-black">Accueil</Link>
        <span>/</span>
        <Link to="/boutique" className="hover:text-black">Boutique</Link>
        <span>/</span>
        <Link to={`/boutique?category=${product.category?.slug}`} className="hover:text-black">{product.category?.name}</Link>
        <span>/</span>
        <span className="text-black">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Gallery */}
        <div>
          <div className="aspect-square bg-gray-100 mb-4 overflow-hidden">
            {product.images?.[activeImage]?.url && product.images[activeImage].url !== '/placeholder-product.jpg' ? (
              <img src={product.images[activeImage].url} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              /* PLACEHOLDER: Remplacez par la photo du produit */
              <div className="w-full h-full flex items-center justify-center text-gray-300">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((img, i) => (
                <button key={img.id} onClick={() => setActiveImage(i)} className={`aspect-square bg-gray-100 border-2 ${i === activeImage ? 'border-black' : 'border-transparent'}`}>
                  {img.url !== '/placeholder-product.jpg' ? (
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  ) : <div className="w-full h-full bg-gray-100" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide mb-2">{product.category?.name}</p>
          <h1 className="font-heading font-black text-3xl md:text-4xl mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-6">
            <span className="font-heading font-black text-2xl">{product.price} {t('product.currency')}</span>
            {hasDiscount && (
              <span className="text-gray-400 line-through text-lg">{product.oldPrice} {t('product.currency')}</span>
            )}
            {!hasStock && <Badge variant="danger">{t('product.soldOut')}</Badge>}
          </div>

          {product.description && (
            <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>
          )}

          {/* Colors */}
          {colors.length > 1 && (
            <div className="mb-6">
              <label className="font-heading font-semibold text-sm uppercase tracking-wide mb-3 block">Couleur</label>
              <div className="flex gap-2">
                {colors.map(c => (
                  <button key={c} onClick={() => setSelectedColor(c)}
                    className={`px-4 py-2 border text-sm ${selectedColor === c ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'} transition-colors`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          <div className="mb-6">
            <label className="font-heading font-semibold text-sm uppercase tracking-wide mb-3 block">{t('product.selectSize')}</label>
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
              {product.variants.filter((v, i, arr) => arr.findIndex(x => x.size === v.size) === i).map(v => {
                const variant = product.variants.find(x => x.size === v.size && (!selectedColor || x.color === selectedColor));
                const inStock = variant?.isAvailable && variant?.stock > 0;
                return (
                  <button
                    key={v.size}
                    disabled={!inStock}
                    onClick={() => setSelectedSize(v.size)}
                    className={`py-3 border text-sm font-heading font-semibold transition-all ${
                      !inStock ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed' :
                      selectedSize === v.size ? 'border-black bg-black text-white' :
                      'border-gray-200 hover:border-black'
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-8">
            <label className="font-heading font-semibold text-sm uppercase tracking-wide mb-3 block">{t('product.quantity')}</label>
            <div className="flex items-center border border-gray-200 w-fit">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3 hover:bg-gray-50 text-lg">−</button>
              <span className="px-6 py-3 font-heading font-semibold border-x border-gray-200">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(10, q + 1))} className="px-4 py-3 hover:bg-gray-50 text-lg">+</button>
            </div>
          </div>

          {/* Add to cart */}
          <button
            onClick={handleAddToCart}
            disabled={!hasStock || !selectedSize}
            className={`w-full py-4 font-heading font-bold text-sm uppercase tracking-widest transition-all ${
              hasStock && selectedSize ? 'btn-primary' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {!hasStock ? t('product.soldOut') : !selectedSize ? t('product.selectSize') : t('product.addToCart')}
          </button>
        </div>
      </div>

      {/* Related products */}
      {related?.length > 0 && (
        <section className="mt-20">
          <h2 className="font-heading font-black text-2xl mb-8">{t('product.relatedProducts')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
