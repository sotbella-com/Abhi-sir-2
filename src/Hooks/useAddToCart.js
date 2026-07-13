import { useState } from 'react';
import { useUnifiedCartStore } from '../context/unifiedCartStore.js';
import { useAuth } from "@/context/AuthContext";

/**
 * Custom hook for adding products to cart
 * Handles both guest and authenticated user flows with unified cart management
 */
export const useAddToCart = () => {
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState(null);
  
  const { isAuthenticated } = useAuth();
  const { addToBasket, initializeCart } = useUnifiedCartStore();

  const addToCart = async (productId, quantity = 1, options = {}) => {
    setIsAdding(true);
    setError(null);

    try {
      // Ensure cart is initialized
      await initializeCart();
      
      // Add item to the appropriate basket (guest or customer)
      // productId should be in format like "ST-1196L"
      await addToBasket(productId, quantity);

      // Show success message or trigger success callback immediately
      if (options.onSuccess) {
        options.onSuccess();
      }

      return { success: true };
    } catch (err) {
      const errorMessage = err.message || 'Failed to add item to cart';
      setError(errorMessage);
      
      if (options.onError) {
        options.onError(errorMessage);
      }

      return { success: false, error: errorMessage };
    } finally {
      setIsAdding(false);
    }
  };

  const addToCartWithOptions = async (productId, quantity = 1, productOptions = {}) => {
    return addToCart(productId, quantity, productOptions);
  };

  return {
    addToCart,
    addToCartWithOptions,
    isAdding,
    error,
    clearError: () => setError(null)
  };
};

export default useAddToCart;
