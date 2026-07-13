import React, { useState } from "react";
import { LoginModal, VerifyOTPModal } from "..";
import { useAuth } from "@/context/AuthContext";
import CreateAccountModal from "../createAccountModal";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useAddressStore, useWishlistStore } from "@/context";

const LoginFlowModal = ({
  onCompletion = () => { },
  modalType,
  setModalType,
}) => {
  const { user, isAuthenticated, logout, login, setUser } = useAuth();

  const { fetchWishlist } = useWishlistStore();
  // Removed old cart store usage
  const { fetchAddress } = useAddressStore();

  const [loaderType, setLoaderType] = useState("");

  return (
    <div>
      {modalType == "LOGIN" && (
        <LoginModal
          visible={modalType == "LOGIN"}
          // sendOTP={sendOTP}
          onCancel={() => {
            setModalType("");
          }}
          setModalType={setModalType}
        />
      )}

      {modalType == "OTP" && (
        <VerifyOTPModal
          visible={modalType == "OTP"}
          isLoading={loaderType == "OTP"}
          setModalType={setModalType}
          onCancel={() => setModalType("")}
        />
      )}

      {modalType == "CREATE_ACCOUNT" && (
        <CreateAccountModal
          open={modalType == "CREATE_ACCOUNT"}
          onCancel={() => setModalType("")}
          setModalType={setModalType}
          onConfirm={(status) => {
            if (status === "SUCCESS") {
              fetchWishlist({ customerId: user?.id });
              fetchAddress({ customerId: user?.id });
              onCompletion();
            }
          }}
          email={
            (() => {
              try {
                const parsed = JSON.parse(
                  localStorage.getItem(LOCAL_KEYS.LOGIN_DATA) || "{}"
                );
                return parsed?.email || "";
              } catch {
                return "";
              }
            })()
          }
        />
      )}
    </div>
  );
};

export default LoginFlowModal;
