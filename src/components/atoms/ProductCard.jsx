import React from 'react';
import { 
  Box, 
  Image, 
  Text, 
  VStack, 
  HStack, 
  Badge,
  Divider
} from '@chakra-ui/react';
import AddToCartButton from './AddToCartButton.jsx';

/**
 * Simple Product Card Component
 * Shows product info with add to cart functionality
 */
const ProductCard = ({ 
  product, 
  showAddToCart = true,
  ...props 
}) => {
  if (!product) return null;

  return (
    <Box
      border="1px"
      borderColor="gray.200"
      borderRadius="md"
      overflow="hidden"
      bg="white"
      shadow="sm"
      _hover={{ shadow: "md" }}
      transition="all 0.2s"
      {...props}
    >
      {/* Product Image */}
      <Box position="relative" h="200px" overflow="hidden">
        {product.imageGroups?.[0]?.images?.[0] ? (
          <Image
            src={product.imageGroups[0].images[0].link}
            alt={product.name}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Box
            w="100%"
            h="100%"
            bg="gray.100"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="gray.500" fontSize="sm">
              No Image
            </Text>
          </Box>
        )}
        
        {/* Product Type Badge */}
        {product.c_productType && (
          <Badge
            position="absolute"
            top="2"
            right="2"
            colorScheme="blue"
            fontSize="xs"
          >
            {product.c_productType}
          </Badge>
        )}
      </Box>

      {/* Product Info */}
      <VStack spacing={3} p={4} align="stretch">
        {/* Product Name */}
        <Text
          fontSize="sm"
          fontWeight="medium"
          noOfLines={2}
          minH="2.5em"
        >
          {product.name}
        </Text>

        {/* Price */}
        <HStack justify="space-between" align="center">
          <Text fontSize="lg" fontWeight="bold" color="blue.600">
            ₹{product.price?.toFixed(2) || '0.00'}
          </Text>
          
          {/* Stock Status */}
          {product.inventory?.stockLevel > 0 ? (
            <Badge colorScheme="green" fontSize="xs">
              In Stock
            </Badge>
          ) : (
            <Badge colorScheme="red" fontSize="xs">
              Out of Stock
            </Badge>
          )}
        </HStack>

        {/* Product Tags */}
        {product.c_tags && product.c_tags.length > 0 && (
          <HStack spacing={1} flexWrap="wrap">
            {product.c_tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} size="sm" colorScheme="gray" variant="subtle">
                {tag}
              </Badge>
            ))}
            {product.c_tags.length > 3 && (
              <Badge size="sm" colorScheme="gray" variant="subtle">
                +{product.c_tags.length - 3} more
              </Badge>
            )}
          </HStack>
        )}

        <Divider />

        {/* Add to Cart Button */}
        {showAddToCart && (
          <AddToCartButton
            productId={product.id}
            quantity={1}
            isFullWidth
            colorScheme="blue"
            size="sm"
            disabled={!product.inventory?.stockLevel || product.inventory.stockLevel <= 0}
          >
            {!product.inventory?.stockLevel || product.inventory.stockLevel <= 0 
              ? 'Out of Stock' 
              : 'Add to Cart'
            }
          </AddToCartButton>
        )}
      </VStack>
    </Box>
  );
};

export default ProductCard;
