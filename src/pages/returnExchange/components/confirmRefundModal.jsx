// ConfirmRefundModal.jsx
import {
  Box,
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalOverlay,
  Text,
  ModalCloseButton,
} from "@chakra-ui/react";

const ConfirmRefundModal = ({
  isOpen,
  onClose,
  onConfirmRefund,
  onOtherOptions,
  isLoading = false,
  amount = 0,
  currency = "Rs.",
}) => {
  const formatted =
    typeof amount === "number"
      ? amount.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : amount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered closeOnOverlayClick={!isLoading}>
      <ModalOverlay bg="blackAlpha.600" />

      <ModalContent
        borderRadius={0}
        maxW="520px"
        p={0}
        boxShadow="none"
        border="1px solid"
        borderColor="black"
      >
        {/* ✅ Chakra official close button (works always) */}
        <ModalCloseButton
          borderRadius={0}
          disabled={isLoading}
          _focus={{ boxShadow: "none" }}
        />

        <ModalBody p={0}>
          <Box p={6}>
            <Flex align="center" justify="center" mb={4}>
              <Text fontWeight="bold" letterSpacing="wide">
                CONFIRM REFUND
              </Text>
            </Flex>

            <Text textAlign="center" fontSize="sm" color="blackAlpha.800" mb={4}>
              Your{" "}
              <Text as="span" fontWeight="bold" color="black">
                {currency} {formatted}
              </Text>{" "}
              refund will be instantly credited to your Sotbella Wallet.
            </Text>

            <Button
              w="full"
              h="44px"
              borderRadius={0}
              bg="black"
              color="white"
              _hover={{ bg: "black" }}
              isLoading={isLoading}
              onClick={onConfirmRefund}
            >
              CONFIRM REFUND
            </Button>

            <Box mt={2} textAlign="center">
              <Button
                variant="ghost"
                borderRadius={0}
                fontSize="xs"
                color="blackAlpha.700"
                _hover={{ bg: "transparent" }}
                isDisabled={isLoading}
                onClick={onOtherOptions}
              >
                OTHER OPTIONS
              </Button>
            </Box>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmRefundModal;
