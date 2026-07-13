import React, { useState, useEffect } from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Button, 
  Badge,
  Divider,
  Alert,
  AlertIcon,
  Spinner,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer
} from '@chakra-ui/react';
import { useUnifiedCartStore } from '../../context/unifiedCartStore.js';

/**
 * Customer Cart Data Component
 * Displays customer-specific cart data from SFCC
 */
const CustomerCartData = () => {
  const { 
    getCustomerBaskets, 
    getCustomerId, 
    hasCustomerData, 
    isLoading, 
    error 
  } = useUnifiedCartStore();
  
  const [customerBaskets, setCustomerBaskets] = useState(null);
  const [customerId, setCustomerId] = useState(null);

  useEffect(() => {
    // Get customer ID on component mount
    const storedCustomerId = getCustomerId();
    setCustomerId(storedCustomerId);
  }, [getCustomerId]);

  const handleGetCustomerBaskets = async () => {
    try {
      const baskets = await getCustomerBaskets();
      setCustomerBaskets(baskets);
    } catch (error) {
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Box p={6} maxW="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="2xl" fontWeight="bold">
            Customer Cart Data
          </Text>
          <Button 
            onClick={handleGetCustomerBaskets}
            isLoading={isLoading}
            colorScheme="blue"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Get Customer Baskets'}
          </Button>
        </HStack>

        {/* Customer ID Display */}
        <Box p={4} bg="blue.50" borderRadius="md">
          <HStack>
            <Text fontWeight="medium">Customer ID:</Text>
            {customerId ? (
              <Badge colorScheme="green" fontSize="sm">
                {customerId}
              </Badge>
            ) : (
              <Badge colorScheme="red" fontSize="sm">
                No Customer ID
              </Badge>
            )}
          </HStack>
          <Text fontSize="sm" color="gray.600" mt={2}>
            {hasCustomerData() 
              ? 'Customer data is available. You can fetch customer baskets.' 
              : 'No customer data found. Add items to cart first to create a customer profile.'
            }
          </Text>
        </Box>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            <Text>{error}</Text>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading && (
          <HStack justify="center">
            <Spinner size="sm" />
            <Text>Loading customer baskets...</Text>
          </HStack>
        )}

        {/* Customer Baskets Data */}
        {customerBaskets && (
          <VStack spacing={4} align="stretch">
            <HStack justify="space-between" align="center">
              <Text fontSize="lg" fontWeight="semibold">
                Customer Baskets ({customerBaskets.baskets?.length || customerBaskets.length || 0})
              </Text>
              {customerBaskets.total && (
                <Badge colorScheme="blue" fontSize="sm">
                  Total: {customerBaskets.total}
                </Badge>
              )}
            </HStack>

            {(customerBaskets.baskets?.length === 0 || customerBaskets.length === 0) ? (
              <Alert status="info">
                <AlertIcon />
                <Text>No baskets found for this customer.</Text>
              </Alert>
            ) : (
              <VStack spacing={4} align="stretch">
                {(customerBaskets.baskets || customerBaskets).map((basket, index) => (
                  <Box key={basket.basketId || index} p={4} border="1px" borderColor="gray.200" borderRadius="md">
                    <VStack spacing={3} align="stretch">
                      {/* Basket Header */}
                      <HStack justify="space-between">
                        <VStack align="start" spacing={1}>
                          <Text fontWeight="bold" fontSize="md">
                            Basket #{index + 1}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            ID: {basket.basketId}
                          </Text>
                        </VStack>
                        <VStack align="end" spacing={1}>
                          <Text fontWeight="bold" color="green.600">
                            {formatCurrency(basket.productTotal)}
                          </Text>
                          <Text fontSize="sm" color="gray.600">
                            {formatDate(basket.creationDate)}
                          </Text>
                        </VStack>
                      </HStack>

                      {/* Basket Details */}
                      <HStack spacing={4} fontSize="sm" color="gray.600">
                        <Text>Currency: {basket.currency}</Text>
                        <Text>Channel: {basket.channelType}</Text>
                        <Text>Items: {basket.productItems?.length || 0}</Text>
                      </HStack>

                      {/* Product Items */}
                      {basket.productItems && basket.productItems.length > 0 && (
                        <Box>
                          <Text fontWeight="medium" mb={2}>Products:</Text>
                          <TableContainer>
                            <Table size="sm">
                              <Thead>
                                <Tr>
                                  <Th>Product</Th>
                                  <Th>Quantity</Th>
                                  <Th>Price</Th>
                                  <Th>Total</Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {basket.productItems.map((item, itemIndex) => (
                                  <Tr key={item.itemId || itemIndex}>
                                    <Td>
                                      <VStack align="start" spacing={0}>
                                        <Text fontSize="sm" fontWeight="medium">
                                          {item.productName}
                                        </Text>
                                        <Text fontSize="xs" color="gray.500">
                                          ID: {item.productId}
                                        </Text>
                                      </VStack>
                                    </Td>
                                    <Td>{item.quantity}</Td>
                                    <Td>{formatCurrency(item.basePrice)}</Td>
                                    <Td>{formatCurrency(item.price * item.quantity)}</Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                          </TableContainer>
                        </Box>
                      )}

                      {/* Basket Totals */}
                      <Divider />
                      <HStack justify="space-between" fontSize="sm">
                        <Text>Product Subtotal:</Text>
                        <Text fontWeight="medium">{formatCurrency(basket.productSubTotal)}</Text>
                      </HStack>
                      <HStack justify="space-between" fontSize="sm">
                        <Text>Product Total:</Text>
                        <Text fontWeight="bold" color="green.600">
                          {formatCurrency(basket.productTotal)}
                        </Text>
                      </HStack>
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </VStack>
        )}

        {/* Instructions */}
        <Box p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            How to use Customer Cart Data:
          </Text>
          <VStack align="start" spacing={1} fontSize="sm" color="gray.600">
            <Text>1. Add items to cart to create a customer profile</Text>
            <Text>2. Customer ID is automatically stored in localStorage</Text>
            <Text>3. Use "Get Customer Baskets" to fetch all customer baskets</Text>
            <Text>4. View detailed basket information and product items</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default CustomerCartData;
