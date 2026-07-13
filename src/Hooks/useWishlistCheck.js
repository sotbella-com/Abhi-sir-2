import { useEffect, useMemo } from 'react';
import { useWishlistStore } from '@/context/wishlistStore';
import { useAuth } from '@/context/AuthContext';

/**
 * Custom hook to check if a product is in wishlist
 * Automatically fetches wishlist if user is authenticated and wishlist is empty
 * @returns {Object} { isInWishlist: function, wishListProduct: array, fetchWishlist: function }
 */
export const useWishlistCheck = () => {
  const { isAuthenticated, user } = useAuth();
  const wishListProduct = useWishlistStore((s) => s.wishListProduct);
  const fetchWishlist = useWishlistStore((s) => s.fetchWishlist);
  const isInWishlistStore = useWishlistStore((s) => s.isInWishlist);

  // Fetch wishlist on mount if authenticated and wishlist is empty
  useEffect(() => {
    if (isAuthenticated && user?.id && (!wishListProduct || wishListProduct.length === 0)) {
      fetchWishlist({ customerId: user.id });
    }
  }, [isAuthenticated, user?.id, fetchWishlist, wishListProduct]);

  // Memoized function to check if product is in wishlist
  const isInWishlist = useMemo(() => {
    return (productId) => {
      if (!productId) return false;
      // Use store's isInWishlist function for consistency
      return isInWishlistStore(productId);
    };
  }, [isInWishlistStore]);

  return {
    isInWishlist,
    wishListProduct,
    fetchWishlist,
  };
};

