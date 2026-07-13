import React, { useState } from "react";
import { LoginModal, VerifyOTPModal } from "..";
import { useAuth } from "@/context/AuthContext";
import CreateAccountModal from "../createAccountModal";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useAddressStore, useWishlistStore } from "@/context";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  Button,
  Text,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";

const LoginFlowModal = ({
  onCompletion = () => { },
  onNewUser,
  onPreorderClose = () => { },
  modalType,
  setModalType,
  isHidden,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { fetchWishlist } = useWishlistStore();
  const { fetchAddress } = useAddressStore();

  const [loaderType, setLoaderType] = useState("");

  return (
    <div>
      {modalType === "LOGIN" && (
        <LoginModal
          visible={modalType === "LOGIN"}
          onCancel={() => {
            setModalType("");
          }}
          setModalType={setModalType}
          onNewUser={onNewUser}
          isHidden={isHidden}
        />
      )}

      {modalType === "PREORDER" && (
        <Modal
          isOpen={modalType === "PREORDER"}
          onClose={() => setModalType("")}
          isCentered
        >
          <ModalOverlay />
          <ModalContent borderRadius="0" mx={4}>
            <ModalBody py={6}>
              <Text
                textAlign="center"
                fontSize="md"
                fontWeight="600"
                mb={3}
              >
                Exclusive Pre-Order Access
              </Text>

              <Text
                textAlign="center"
                fontSize="sm"
                color="gray.600"
                mb={6}
              >
                This style is currently available as a pre-order item for our
                existing customers only.
                <br />
                <br />
                If you're new to Sötbella, explore our latest collection and discover
                styles available for immediate purchase.
              </Text>

              <Button
                w="full"
                bg="black"
                color="white"
                borderRadius="0"
                mb={3}
                _hover={{ bg: "#1d1d1d" }}
                onClick={() => {
                  setModalType("");
                  navigate("/category/all dresses");
                }}
              >
                Browse All Dresses
              </Button>

              {/* <Button
                w="full"
                variant="outline"
                borderRadius="0"
                onClick={() => {
                  setModalType("");
                }}
                _hover={{ bg: "#fff" }}
              >
                Close
              </Button> */}
            </ModalBody>
          </ModalContent>
        </Modal>
      )}

      {modalType === "OTP" && (
        <VerifyOTPModal
          visible={modalType === "OTP"}
          isLoading={loaderType === "OTP"}
          setModalType={setModalType}
          onCancel={() => setModalType("")}
          onVerify={() => {
            fetchWishlist({ customerId: user?.id });
            fetchAddress({ customerId: user?.id });
            onCompletion();
          }}
        />
      )}

      {modalType === "CREATE_ACCOUNT" && (
        <CreateAccountModal
          open={modalType === "CREATE_ACCOUNT"}
          onCancel={() => setModalType("")}
          setModalType={setModalType}
          onConfirm={(status) => {
            if (status === "SUCCESS") {
              fetchWishlist({ customerId: user?.id });
              fetchAddress({ customerId: user?.id });
              onCompletion();
            }
          }}
          email={(() => {
            try {
              const parsed = JSON.parse(
                localStorage.getItem(LOCAL_KEYS.LOGIN_DATA) || "{}"
              );
              return parsed?.email || "";
            } catch {
              return "";
            }
          })()}
        />
      )}
    </div>
  );
};

export default LoginFlowModal;