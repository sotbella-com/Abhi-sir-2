import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Button,
  Flex,
} from "@chakra-ui/react";

const RefundPopup = ({
  isOpen,
  onClose,
  amountText = "₹ 0",
  onConfirmRefund,
  onOtherOptions,
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      closeOnOverlayClick
      closeOnEsc
    >
      <ModalOverlay />
      <ModalContent rounded="none" maxW="640px" p={6}>
        <ModalCloseButton
          onClick={onClose}
          top="12px"
          right="12px"
          borderRadius="0"
        />

        <ModalBody p={0}>
          <Box textAlign="center">
            <Text fontWeight="bold" letterSpacing="wide" mb={3}>
              CONFIRM REFUND
            </Text>

            <Text fontSize="sm" color="blackAlpha.800" mb={5}>
              Your <b>{amountText}</b> refund will be instantly credited to your
              Sotbella Wallet.
            </Text>

            <Button
              w="full"
              rounded="none"
              bg="black"
              color="white"
              _hover={{ bg: "black" }}
              onClick={onConfirmRefund}
              isLoading={isLoading}
            >
              CONFIRM REFUND
            </Button>

            <Button
              variant="ghost"
              mt={3}
              rounded="none"
              fontSize="sm"
              letterSpacing="wide"
              color="blackAlpha.700"
              _hover={{ bg: "transparent" }}
              onClick={onOtherOptions}
              isDisabled={isLoading}
            >
              OTHER OPTIONS
            </Button>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default RefundPopup;
