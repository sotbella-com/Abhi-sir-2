import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  Divider,
  VStack,
  Collapse,
} from "@chakra-ui/react";
import { ChevronDownIcon, ChevronUpIcon } from "@chakra-ui/icons";

const ExchangeOrderSummary = ({
  basket,
  onPlaceOrder,
  isPlacingOrder,
  isButtonDisabled,
  currencyCode = "Rs.",
  exchangeData,
}) => {
  const [showTaxBreakup, setShowTaxBreakup] = useState(false);

  // Helper
  const toNum = (val) => Number(val) || 0;

  // Basket values
  const subTotal = toNum(basket?.productSubTotal || basket?.productTotal || 0);
  const shippingTotal = toNum(basket?.shippingTotal || 0);
  const taxTotal = toNum(basket?.taxTotal || basket?.totalTax || 0);
  const orderTotal = toNum(basket?.orderTotal || 0);

  // Discounts
  const orderLevelDiscount = (basket?.orderPriceAdjustments || []).reduce(
    (acc, adj) => acc + toNum(adj?.price),
    0
  );

  const totalDiscount = Math.abs(orderLevelDiscount);

  // Refund
  const refundAmount = toNum(exchangeData?.refundAmount || 0);

  // Combined previous product value
  const previousProductValue = refundAmount + totalDiscount;

  return (
    <Box w={{ base: "100%", md: "50%" }} mt={{ base: 4, md: 20 }}>
      <Box borderWidth="1px" borderColor="blackAlpha.500" p={{ base: 2, md: 4 }} bg="white">
        <Text fontSize="lg" fontWeight="semibold" mb={4} textTransform="uppercase">
          Order Summary
        </Text>

        <VStack spacing={3} align="stretch">

          {/* Subtotal */}
          <Flex justify="space-between">
            <Text color="gray.600">Subtotal (New Product)</Text>
            <Text fontWeight="medium">
              {currencyCode} {subTotal.toFixed(2)}
            </Text>
          </Flex>

          {/* Previous Product Price */}
          {previousProductValue > 0 && (
            <Flex justify="space-between" color="green.600">
              <Text>Previous Product Price</Text>
              <Text fontWeight="medium">
                - {currencyCode} {previousProductValue.toFixed(2)}
              </Text>
            </Flex>
          )}

          {/* Order Adjustments Breakdown */}
          {Array.isArray(exchangeData?.basket?.orderPriceAdjustments) &&
            exchangeData.basket.orderPriceAdjustments.map((item, index) => (
              <Flex
                key={index}
                justify="space-between"
                fontSize="xs"
                color="green.600"
                mt={-2}
              >
                <Text>{item?.lineItemText}</Text>
                <Text fontWeight="medium">
                  - {currencyCode} {Math.abs(toNum(item?.price)).toFixed(2)}
                </Text>
              </Flex>
            ))}

          {/* Wallet message */}
          {refundAmount > 0 && (
            <Text fontSize="xs" color="green.600" mt={-2}>
              ({currencyCode} {refundAmount.toFixed(2)} will be credited to your wallet after exchange is processed)
            </Text>
          )}

          {/* Shipping */}
          <Flex justify="space-between">
            <Text color="gray.600">Shipping</Text>
            <Text fontWeight="medium">
              {shippingTotal > 0
                ? `${currencyCode} ${shippingTotal.toFixed(2)}`
                : "Free"}
            </Text>
          </Flex>

          <Divider my={2} />

          {/* Total / Refund */}
          {refundAmount > 0 ? (
            <Flex
              justify="space-between"
              fontSize="lg"
              fontWeight="bold"
              color="green.600"
            >
              <Text>Refund Amount</Text>
              <Text>
                {currencyCode} {refundAmount.toFixed(2)}
              </Text>
            </Flex>
          ) : (
            <Flex
              justify="space-between"
              align="center"
              fontSize="lg"
              fontWeight="bold"
              onClick={() => taxTotal > 0 && setShowTaxBreakup(!showTaxBreakup)}
              cursor={taxTotal > 0 ? "pointer" : "default"}
            >
              <Flex align="center" gap={2}>
                <Text>Total Price (Incl. of all taxes)</Text>

                {/* ✅ Dropdown Icon */}
                {taxTotal > 0 && (
                  showTaxBreakup ? (
                    <ChevronUpIcon boxSize={5} />
                  ) : (
                    <ChevronDownIcon boxSize={5} />
                  )
                )}
              </Flex>

              <Text>
                {currencyCode} {orderTotal.toFixed(2)}
              </Text>
            </Flex>
          )}

          {/* Collapsible Tax */}
          <Collapse in={showTaxBreakup} animateOpacity>
            <Flex justify="space-between" mt={2}>
              <Text color="gray.600" fontSize="xs">
                Tax
              </Text>
              <Text fontWeight="medium" fontSize="xs">
                {currencyCode} {taxTotal.toFixed(2)}
              </Text>
            </Flex>
          </Collapse>

        </VStack>

        {/* Checkout Button */}
        <Button
          w="full"
          mt={6}
          bg="black"
          color="white"
          borderRadius="0"
          _hover={{ bg: "gray.800" }}
          onClick={onPlaceOrder}
          isDisabled={isButtonDisabled}
          isLoading={isPlacingOrder}
          loadingText="Placing Order..."
          textTransform="uppercase"
        >
          Place Order
        </Button>
      </Box>
    </Box>
  );
};

export default ExchangeOrderSummary;