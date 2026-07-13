import React, { useState, Fragment, useEffect } from "react";
import { Modal, Typography } from "antd";
import {
  Box,
  Flex,
  Image as ChakraImage,
  Text,
  Input,
} from "@chakra-ui/react";
import { MdEmail } from "react-icons/md";
import logo from "@/assets/images/sotbell-new-logo.png";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoadingButton } from "@/components/atoms";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";

const { Title, Paragraph } = Typography;

const emailRegex = /\S+@\S+\.\S+/;

const LoginModal = ({ visible, onCancel, setModalType }) => {
  const [email, setEmail] = useState("");
  const { checkUserExists, loading, clearError, error } = useAuth();

  // lock scroll when modal is open
  useEffect(() => {
    if (!visible) return;
    const scrollY = window.scrollY || 0;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    const blockTouchMove = (e) => {
      const withinModal = e.target.closest(".ant-modal");
      if (!withinModal) e.preventDefault();
    };
    document.addEventListener("touchmove", blockTouchMove, { passive: false });

    return () => {
      document.removeEventListener("touchmove", blockTouchMove);
      document.documentElement.style.overflow = prevHtmlOverflow || "";
      document.body.style.overflow = prevBodyOverflow || "";
      window.scrollTo(0, scrollY);
    };
  }, [visible]);

  // show auth errors as toast
  useEffect(() => {
    if (!error) return;
    const msg =
      typeof error === "string" ? error : error?.message || "Something went wrong";
    // toast.error(msg);
    clearError?.();
  }, [error, clearError]);

  const handleSendOTP = async () => {
    const clean = (email || "").trim();
    if (!clean) {
      // toast.error("Please enter your email");
      return;
    }
    if (!emailRegex.test(clean)) {
      // toast.error("Please enter a valid email");
      return;
    }

    try {
      clearError?.();

      // same semantics as MainLoginPage:
      // - checkUserExists triggers OTP for existing users
      const result = await checkUserExists(clean);

      if (result?.success && result?.userExists) {
        // toast.success("OTP sent to your email");

        // persist for OTP step
        localStorage.setItem(
          LOCAL_KEYS.LOGIN_DATA,
          JSON.stringify({ email: clean, type: "email" })
        );

        // switch to OTP modal
        setModalType("OTP");
      } else {
        // new user — go to Create Account modal and pass email
        // toast.error("Please create an account.");
        localStorage.setItem(
          LOCAL_KEYS.LOGIN_DATA,
          JSON.stringify({ email: clean, type: "email" })
        );
        setModalType("CREATE_ACCOUNT");
      }
    } catch (e) {
      // toast.error("Unable to process login. Please try again.");
    }
  };

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      closeIcon={true}
      bodyStyle={{ padding: "24px 32px" }}
      style={{ scrollBehavior: "unset" }}
    >
      <Fragment>
        {/* Logo */}
        <Flex justify="center" mb={4}>
          <ChakraImage src={logo} alt="Logo" maxH="50px" />
        </Flex>

        {/* Title */}
        <Box textAlign="center" mb={3}>
          <Title level={3} style={{ margin: 0 }}>
            Login / Sign up
          </Title>
        </Box>

        {/* Email Input (with icon) */}
        <Box border="1px solid" borderColor="blackAlpha.300" px={0} py={0} mb={4}>
          <Flex align="center" h="48px" w="full">
            <Box px={3} display="flex" alignItems="center" gap={2}>
              <MdEmail style={{ fontSize: 18, color: "#666" }} />
            </Box>
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              flex="1"
              h="full"
              fontSize="sm"
              px={2}
              border="none"
              _hover={{ borderColor: "black" }}
              _focus={{
                boxShadow: "none",
                outline: "none",
                borderColor: "black",
              }}
              _focusVisible={{
                boxShadow: "none",
                outline: "none",
                borderColor: "black",
              }}
              _placeholder={{ color: "blackAlpha.800", fontSize: "sm" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSendOTP();
              }}
            />
          </Flex>
        </Box>

        {/* Action */}
        <LoadingButton
          type="primary"
          block
          onClick={handleSendOTP}
          disabled={!email}
          isLoading={loading}
          loadingText="Sending OTP ..."
        >
          Send OTP
        </LoadingButton>

        {/* Terms */}
        <Box textAlign="center" mt={3}>
          <Paragraph
            style={{
              marginBottom: 0,
              fontSize: "0.9rem",
              color: "grey",
            }}
          >
            By proceeding, you agree to our{" "}
            <a
              href="/privacypolicy"
              style={{
                color: "black",
                textDecoration: "underline",
              }}
            >
              Privacy Policy
            </a>{" "}
            and{" "}
            <a
              href="/terms"
              style={{
                color: "black",
                textDecoration: "underline",
              }}
            >
              Terms of Use
            </a>
          </Paragraph>
        </Box>
      </Fragment>
    </Modal>
  );
};

export default LoginModal;
