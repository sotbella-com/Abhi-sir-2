import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  Box,
  Text,
  Button,
  Flex,
} from "@chakra-ui/react";

const ConfirmReturnModal = ({ isOpen, onClose, onReturn, onExchange }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      closeOnEsc
      closeOnOverlayClick
    >
      <ModalOverlay />
      <ModalContent rounded="none" maxW="640px" p={6}>
        {/* IMPORTANT: Do NOT override onClick here. Chakra handles it. */}
        <ModalCloseButton top="12px" right="12px" borderRadius="0" />

        <ModalBody p={0}>
          <Box>
            <Text fontWeight="bold" letterSpacing="wide" mb={2}>
              CONFIRM RETURN
            </Text>

            <Text fontSize="sm" color="blackAlpha.800" mb={6}>
              Exchanges are complimentary with 5% off on your new selection. ₹150 service fee applies on returns.
            </Text>

            <Flex gap={3}>
              <Button
                w="50%"
                rounded="none"
                variant="outline"
                borderColor="black"
                onClick={onReturn}
              >
                RETURN
              </Button>

              <Button
                w="50%"
                rounded="none"
                bg="black"
                color="white"
                _hover={{ bg: "black" }}
                onClick={onExchange}
              >
                EXCHANGE
              </Button>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmReturnModal;
