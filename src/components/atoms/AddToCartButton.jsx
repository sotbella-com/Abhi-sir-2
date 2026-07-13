import React from 'react';
import { Button, Spinner } from '@chakra-ui/react';
import { toast } from 'react-toastify';
import { useAddToCart } from '../../Hooks/useAddToCart.js';

/**
 * Add to Cart Button Component
 * Handles adding products to cart for both guest and authenticated users
 */
const AddToCartButton = ({
  productId,
  quantity = 1,
  variant = 'solid',
  colorScheme = 'blue',
  size = 'md',
  isFullWidth = false,
  children = 'Add to Cart',
  disabled = false,
  onSuccess,
  onError,
  ...props
}) => {
  const { addToCart, isAdding, error } = useAddToCart();

  const handleAddToCart = async () => {
    const result = await addToCart(productId, quantity, {
      onSuccess: () => {
        // toast.success('Product has been added to your cart successfully!');
        if (onSuccess) onSuccess();
      },
      onError: (errorMessage) => {
        // toast.error(errorMessage || 'Failed to add product to cart');
        if (onError) onError(errorMessage);
      }
    });
  };

  return (
    <Button
      onClick={handleAddToCart}
      variant={variant}
      colorScheme={colorScheme}
      size={size}
      width={isFullWidth ? '100%' : 'auto'}
      disabled={disabled || isAdding || !productId}
      isLoading={isAdding}
      loadingText="Adding..."
      leftIcon={isAdding ? <Spinner size="sm" /> : undefined}
      {...props}
    >
      {children}
    </Button>
  );
};

export default AddToCartButton;
