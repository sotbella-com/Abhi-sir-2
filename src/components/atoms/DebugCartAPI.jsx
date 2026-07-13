import React, { useState } from 'react';
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
  Code,
} from '@chakra-ui/react';
import { toast } from 'react-toastify';
import GuestCartService from '../../api/services/guestCart.js';

/**
 * Debug Component for Testing Cart API Calls
 * Shows the exact API calls being made
 */
const DebugCartAPI = () => {
  const [apiCalls, setApiCalls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const addApiCall = (method, url, body, response) => {
    const newCall = {
      id: Date.now(),
      method,
      url,
      body,
      response,
      timestamp: new Date().toLocaleTimeString()
    };
    setApiCalls(prev => [newCall, ...prev.slice(0, 9)]); // Keep last 10 calls
  };

  const testCreateBasket = async () => {
    setIsLoading(true);
    try {
      const response = await GuestCartService.createBasket();
      addApiCall(
        'POST',
        `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets`,
        '{}',
        response
      );
      toast({ title: 'Basket created successfully', status: 'success' });
    } catch (error) {
      addApiCall(
        'POST',
        `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets`,
        '{}',
        { error: error.message }
      );
      toast({ title: 'Failed to create basket', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const testAddToCart = async () => {
    setIsLoading(true);
    try {
      const response = await GuestCartService.addToBasket('ST-1196L', 1);
      addApiCall(
        'POST',
        `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/{basketId}/items`,
        JSON.stringify([{ productId: 'ST-1196L', quantity: 1 }], null, 2),
        response
      );
      toast({ title: 'Item added successfully', status: 'success' });
    } catch (error) {
      addApiCall(
        'POST',
        `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/{basketId}/items`,
        JSON.stringify([{ productId: 'ST-1196L', quantity: 1 }], null, 2),
        { error: error.message }
      );
      toast({ title: 'Failed to add item', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const testGetCustomerBaskets = async () => {
    setIsLoading(true);
    try {
      const response = await GuestCartService.getCustomerBaskets();
      addApiCall(
        'GET',
        `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/{customerId}/baskets`,
        'No body',
        response
      );
      toast({ title: 'Customer baskets fetched successfully', status: 'success' });
    } catch (error) {
      addApiCall(
        'GET',
        `/customer/shopper-customers/v1/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/customers/{customerId}/baskets`,
        'No body',
        { error: error.message }
      );
      toast({ title: 'Failed to fetch customer baskets', status: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const clearApiCalls = () => {
    setApiCalls([]);
  };

  return (
    <Box p={6} maxW="1000px" mx="auto">
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between" align="center">
          <Text fontSize="2xl" fontWeight="bold">
            Cart API Debug
          </Text>
          <Button size="sm" onClick={clearApiCalls} colorScheme="red" variant="outline">
            Clear Logs
          </Button>
        </HStack>

        <Alert status="info">
          <AlertIcon />
          <Text>
            This component shows the exact API calls being made to SFCC. 
            Use this to debug cart functionality and verify API requests.
          </Text>
        </Alert>

        {/* Test Buttons */}
        <HStack spacing={4} wrap="wrap">
          <Button 
            onClick={testCreateBasket}
            isLoading={isLoading}
            colorScheme="blue"
            size="sm"
          >
            Test Create Basket
          </Button>
          <Button 
            onClick={testAddToCart}
            isLoading={isLoading}
            colorScheme="green"
            size="sm"
          >
            Test Add to Cart (ST-1196L)
          </Button>
          <Button 
            onClick={testGetCustomerBaskets}
            isLoading={isLoading}
            colorScheme="purple"
            size="sm"
          >
            Test Get Customer Baskets
          </Button>
        </HStack>

        <Divider />

        {/* API Calls Log */}
        <VStack spacing={4} align="stretch">
          <Text fontSize="lg" fontWeight="semibold">
            API Calls Log ({apiCalls.length})
          </Text>

          {apiCalls.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No API calls made yet. Click the test buttons above to see API calls.
            </Text>
          ) : (
            <VStack spacing={3} align="stretch">
              {apiCalls.map((call) => (
                <Box key={call.id} p={4} border="1px" borderColor="gray.200" borderRadius="md">
                  <VStack spacing={3} align="stretch">
                    {/* Call Header */}
                    <HStack justify="space-between" align="center">
                      <HStack spacing={2}>
                        <Badge colorScheme={call.method === 'GET' ? 'blue' : 'green'}>
                          {call.method}
                        </Badge>
                        <Text fontSize="sm" fontWeight="medium">
                          {call.url}
                        </Text>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {call.timestamp}
                      </Text>
                    </HStack>

                    {/* Request Body */}
                    {call.body && call.body !== 'No body' && (
                      <Box>
                        <Text fontSize="sm" fontWeight="medium" mb={2}>Request Body:</Text>
                        <Code p={2} fontSize="xs" whiteSpace="pre-wrap">
                          {call.body}
                        </Code>
                      </Box>
                    )}

                    {/* Response */}
                    <Box>
                      <Text fontSize="sm" fontWeight="medium" mb={2}>Response:</Text>
                      <Code p={2} fontSize="xs" whiteSpace="pre-wrap" maxH="200px" overflowY="auto">
                        {JSON.stringify(call.response, null, 2)}
                      </Code>
                    </Box>
                  </VStack>
                </Box>
              ))}
            </VStack>
          )}
        </VStack>

        {/* API Documentation */}
        <Box p={4} bg="gray.50" borderRadius="md">
          <Text fontSize="sm" fontWeight="medium" mb={2}>
            Expected API Format:
          </Text>
          <VStack align="start" spacing={2} fontSize="xs" color="gray.600">
            <Text><strong>Create Basket:</strong> POST /checkout/shopper-baskets/v2/organizations/{`{orgId}`}/baskets</Text>
            <Text><strong>Add to Cart:</strong> POST /checkout/shopper-baskets/v2/organizations/{`{orgId}`}/baskets/{`{basketId}`}/items</Text>
            <Text><strong>Body Format:</strong> [{"{"} "productId": "ST-1196L", "quantity": 1 {"}"}]</Text>
            <Text><strong>Get Customer Baskets:</strong> GET /customer/shopper-customers/v1/organizations/{`{orgId}`}/customers/{`{customerId}`}/baskets</Text>
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default DebugCartAPI;
