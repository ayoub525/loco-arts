import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'
import { useAuth } from './AuthContext'

const WISHLIST_KEY = 'LOCO_wishlist'

const WishlistContext = createContext(null)

function loadLocalWishlist() {
  try {
    const stored = localStorage.getItem(WISHLIST_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth()
  const [items, setItems] = useState(loadLocalWishlist)
  const [isLoading, setIsLoading] = useState(false)

  // Sync from API when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setIsLoading(true)
      api.get('/wishlist')
        .then(({ data }) => {
          const wishlistItems = data.items || data || []
          setItems(wishlistItems)
          localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems))
        })
        .catch(() => {})
        .finally(() => setIsLoading(false))
    } else {
      setItems(loadLocalWishlist())
    }
  }, [isAuthenticated])

  const addToWishlist = useCallback(async (product) => {
    const isAlready = items.some(item =>
      (item._id || item) === (product._id || product)
    )
    if (isAlready) return

    const newItems = [...items, product]
    setItems(newItems)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems))

    if (isAuthenticated) {
      try {
        await api.post('/wishlist', { productId: product._id || product })
      } catch {
        // revert on error
        setItems(items)
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
      }
    }
  }, [items, isAuthenticated])

  const removeFromWishlist = useCallback(async (productId) => {
    const newItems = items.filter(item =>
      (item._id || item) !== productId
    )
    setItems(newItems)
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems))

    if (isAuthenticated) {
      try {
        await api.delete(`/wishlist/${productId}`)
      } catch {
        setItems(items)
        localStorage.setItem(WISHLIST_KEY, JSON.stringify(items))
      }
    }
  }, [items, isAuthenticated])

  const isInWishlist = useCallback((productId) => {
    return items.some(item => (item._id || item) === productId)
  }, [items])

  const toggleWishlist = useCallback(async (product) => {
    const id = product._id || product
    if (isInWishlist(id)) {
      await removeFromWishlist(id)
    } else {
      await addToWishlist(product)
    }
  }, [isInWishlist, addToWishlist, removeFromWishlist])

  return (
    <WishlistContext.Provider value={{
      items,
      isLoading,
      addToWishlist,
      removeFromWishlist,
      isInWishlist,
      toggleWishlist,
      wishlistCount: items.length,
    }}>
      {children}
    </WishlistContext.Provider>
  )
}

export function useWishlist() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider')
  return ctx
}
