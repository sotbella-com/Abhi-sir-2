import React, { useEffect, useState } from 'react';
import { Badge, IconButton, Tooltip } from '@chakra-ui/react';
import { ShoppingCartIcon } from '@heroicons/react/24/outline';
import { useUnifiedCartStore } from '../../context/unifiedCartStore.js';
import { Link } from 'react-router-dom';

/**
 * Cart Icon Component with item count badge
 * Shows the number of items in the cart
 */
const CartIcon = ({ size = 'md', showTooltip = true, ...props }) => {
  const { itemCount } = useUnifiedCartStore();
  const [forceUpdate, setForceUpdate] = useState(0);

  // Listen for cart updates to force re-render
  useEffect(() => {
    const handleCartUpdate = (event) => {
      setForceUpdate(prev => prev + 1);
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const iconSize = {
    sm: '16px',
    md: '20px',
    lg: '24px',
    xl: '28px'
  };

  const buttonSize = {
    sm: 'sm',
    md: 'md',
    lg: 'lg',
    xl: 'xl'
  };

  const cartButton = (
    <IconButton
      as={Link}
      to="/cart"
      aria-label="Shopping Cart"
      icon={<ShoppingCartIcon style={{ width: iconSize[size], height: iconSize[size] }} />}
      size={buttonSize[size]}
      variant="ghost"
      position="relative"
      {...props}
    >
      {itemCount > 0 && (
        <Badge
          position="absolute"
          top="-1"
          right="-1"
          colorScheme="red"
          borderRadius="full"
          fontSize="xs"
          minW="20px"
          h="20px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          {itemCount > 99 ? '99+' : itemCount}
        </Badge>
      )}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip 
        label={`${itemCount} item${itemCount !== 1 ? 's' : ''} in cart`}
        placement="bottom"
      >
        {cartButton}
      </Tooltip>
    );
  }

  return cartButton;
};

export default CartIcon;
