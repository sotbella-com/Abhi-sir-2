import React from "react";
import { useQuery } from "@tanstack/react-query";
// import { get_payment_intent } from "@/api/services/stripe";

// ✅ Chakra UI
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Spinner,
  Center,
  Text,
  Box,
  Stack,
  SimpleGrid,
  Badge,
  Divider,
} from "@chakra-ui/react";

const Row = ({ label, children }) => (
  <Box py={3}>
    <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={4} alignItems="start">
      <Text fontWeight={600} color="gray.700">
        {label}
      </Text>
      <Box>{children}</Box>
    </SimpleGrid>
  </Box>
);

const PaymentDetailsModal = ({ isOpen, onClose, paymentIntentId }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["payment-intent", { paymentIntentId, isOpen }],
    queryFn: () => get_payment_intent({ paymentIntentId }),
    enabled: !!paymentIntentId && isOpen,
  });

  const intent = data?.data;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" isCentered>
      <ModalOverlay />
      <ModalContent maxW="650px">
        <ModalHeader>Payment Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          {isLoading ? (
            <Center py={10}>
              <Spinner size="lg" />
            </Center>
          ) : isError || !intent ? (
            <Text color="red.500" py={2}>
              Failed to load payment details.
            </Text>
          ) : (
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <Stack divider={<Divider />} spacing={0}>
                <Row label="Order ID">
                  <Text>{intent?.metadata?.orderId || "N/A"}</Text>
                </Row>

                <Row label="Payment ID">
                  <Text>{intent?.id}</Text>
                </Row>

                <Row label="Amount (Rs.)">
                  <Text>
                    {(intent?.amount / 100).toFixed(2)}{" "}
                    {intent?.currency?.toUpperCase()}
                  </Text>
                </Row>

                <Row label="Presentment Amount (INR)">
                  <Text>
                    {intent?.presentment_details?.presentment_amount
                      ? (
                          intent.presentment_details.presentment_amount / 100
                        ).toFixed(2)
                      : "N/A"}{" "}
                    {intent?.presentment_details?.presentment_currency?.toUpperCase() ||
                      ""}
                  </Text>
                </Row>

                <Row label="Payment Status">
                  <Badge
                    colorScheme={
                      intent?.status === "succeeded" ? "green" : "orange"
                    }
                    textTransform="capitalize"
                  >
                    {intent?.status}
                  </Badge>
                </Row>

                <Row label="Payment Method ID">
                  <Text>{intent?.payment_method || "N/A"}</Text>
                </Row>

                <Row label="Requested From">
                  <Text>{intent?.metadata?.requestedFrom || "N/A"}</Text>
                </Row>

                <Row label="Customer ID">
                  <Text>{intent?.metadata?.customerId || "N/A"}</Text>
                </Row>

                <Row label="Created At">
                  <Text>
                    {intent?.created
                      ? new Date(intent.created * 1000).toLocaleString()
                      : "N/A"}
                  </Text>
                </Row>
              </Stack>
            </Box>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default PaymentDetailsModal;
