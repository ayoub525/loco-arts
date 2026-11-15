import { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

const CART_KEY = 'loco_cart';

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (product, variant, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.variantId === variant.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, variant.stock, 10);
        toast.success('Quantité mise à jour');
        return prev.map((i) =>
          i.variantId === variant.id ? { ...i, quantity: newQty } : i
        );
      }
      toast.success('Ajouté au panier');
      return [...prev, {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        image: product.images?.[0]?.url || '',
        size: variant.size,
        color: variant.color,
        stock: variant.stock,
        quantity,
      }];
    });
  };

  const removeFromCart = (variantId) => {
    setItems((prev) => prev.filter((i) => i.variantId !== variantId));
    toast.success('Retiré du panier');
  };

  const updateQuantity = (variantId, quantity) => {
    if (quantity < 1) return removeFromCart(variantId);
    setItems((prev) =>
      prev.map((i) => (i.variantId === variantId ? { ...i, quantity: Math.min(quantity, 10) } : i))
    );
  };

  const clearCart = () => setItems([]);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, cartCount, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
