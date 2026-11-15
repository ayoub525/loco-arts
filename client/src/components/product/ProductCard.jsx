import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Badge from '../ui/Badge';

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const image = product.images?.[0]?.url;
  const hasStock = product.variants?.some((v) => v.isAvailable && v.stock > 0);
  const hasDiscount = product.oldPrice && product.oldPrice > product.price;

  return (
    <Link to={`/produit/${product.slug}`} className="group block animate-slide-up">
      {/* Image */}
      <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden mb-3">
        {image && image !== '/placeholder-product.jpg' ? (
          <img
            src={image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          /* PLACEHOLDER: Remplacez par l'image du produit */
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.isNew && <Badge variant="new">{t('product.new')}</Badge>}
          {hasDiscount && <Badge variant="danger">{t('product.promo')}</Badge>}
          {!hasStock && <Badge variant="danger">{t('product.soldOut')}</Badge>}
        </div>
      </div>

      {/* Info */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">{product.category?.name}</p>
        <h3 className="font-heading font-semibold text-sm mb-1 group-hover:text-gray-600 transition-colors">{product.name}</h3>
        <div className="flex items-center gap-2">
          <span className="font-heading font-bold">{product.price} {t('product.currency')}</span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">{product.oldPrice} {t('product.currency')}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
