import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  Box,
  Text,
  Input,
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
} from "@chakra-ui/react";

const BankDetailsModal = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
  defaultMobile = "",
}) => {
  const [bank, setBank] = useState({
    bankName: "",
    accountNumber: "",
    ifscCode: "",
    mobileNumber: defaultMobile || "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setBank({
        bankName: "",
        accountNumber: "",
        ifscCode: "",
        mobileNumber: defaultMobile || "",
      });
      setErrors({});
    }
  }, [isOpen, defaultMobile]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setBank((prev) => ({ ...prev, [name]: value }));

    // ✅ Clear error when user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // ✅ Validation logic
  const validate = () => {
    const newErrors = {};

    if (!bank.bankName.trim()) {
      newErrors.bankName = "Bank name is required";
    }

    if (!bank.accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    } else if (!/^\d{9,18}$/.test(bank.accountNumber)) {
      newErrors.accountNumber = "Enter valid account number";
    }

    // if (!bank.ifscCode.trim()) {
    //   newErrors.ifscCode = "IFSC code is required";
    // } else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifscCode)) {
    //   newErrors.ifscCode = "Invalid IFSC code";
    // }

    if (!bank.ifscCode.trim()) {
      newErrors.ifscCode = "IFSC code is required";
    }

    if (!bank.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required";
    } else if (!/^\d{10}$/.test(bank.mobileNumber)) {
      newErrors.mobileNumber = "Enter valid 10-digit mobile number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validate()) return;

    onConfirm?.(bank);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent rounded="none" maxW="640px" p={6}>
        <ModalCloseButton top="12px" right="12px" />

        <ModalBody p={0}>
          <Box>
            <Text fontWeight="bold" letterSpacing="wide" mb={4}>
              BANK DETAILS
            </Text>

            <Flex direction="column" gap={3}>
              {/* Bank Name */}
              <FormControl isInvalid={errors.bankName}>
                <Input
                  name="bankName"
                  value={bank.bankName}
                  maxLength={50}
                  onChange={handleChange}
                  placeholder="Bank Name"
                  rounded="none"
                  bg="blackAlpha.50"
                  _focus={{ boxShadow: "none" }}
                  _focusVisible={{ boxShadow: "none" }}
                />
                <FormErrorMessage>{errors.bankName}</FormErrorMessage>
              </FormControl>

              {/* Account Number */}
              <FormControl isInvalid={errors.accountNumber}>
                <Input
                  name="accountNumber"
                  value={bank.accountNumber}
                  maxLength={50}
                  onChange={handleChange}
                  placeholder="Account Number"
                  rounded="none"
                  bg="blackAlpha.50"
                  _focus={{ boxShadow: "none" }}
                  _focusVisible={{ boxShadow: "none" }}
                />
                <FormErrorMessage>{errors.accountNumber}</FormErrorMessage>
              </FormControl>

              {/* IFSC */}
              <FormControl isInvalid={errors.ifscCode}>
                <Input
                  name="ifscCode"
                  value={bank.ifscCode}
                  maxLength={50}
                  onChange={handleChange}
                  placeholder="IFSC Code"
                  rounded="none"
                  bg="blackAlpha.50"
                  _focus={{ boxShadow: "none" }}
                  _focusVisible={{ boxShadow: "none" }}
                />
                <FormErrorMessage>{errors.ifscCode}</FormErrorMessage>
              </FormControl>

              {/* Mobile */}
              <FormControl isInvalid={errors.mobileNumber}>
                <Input
                  name="mobileNumber"
                  value={bank.mobileNumber}
                  maxLength={10}
                  onChange={handleChange}
                  placeholder="Mobile Number"
                  rounded="none"
                  bg="blackAlpha.50"
                  _focus={{ boxShadow: "none" }}
                  _focusVisible={{ boxShadow: "none" }}
                />
                <FormErrorMessage>{errors.mobileNumber}</FormErrorMessage>
              </FormControl>

              {/* Buttons */}
              <Flex gap={3} mt={2}>
                <Button
                  w="50%"
                  variant="outline"
                  onClick={onClose}
                  isDisabled={isLoading}
                >
                  CANCEL
                </Button>
                <Button
                  w="50%"
                  bg="black"
                  color="white"
                  _hover={{ bg: "black" }}
                  _active={{ bg: "black" }}
                  _disabled={{ bg: "black", color: "white", opacity: 1 }}
                  onClick={handleConfirm}
                  isLoading={isLoading}
                  loadingText="Please wait..."
                >
                  CONFIRM
                </Button>
              </Flex>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default BankDetailsModal;