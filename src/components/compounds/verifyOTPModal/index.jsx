import React, { useState, useEffect, Fragment, useRef } from "react";
import { Modal as AntdModal } from "antd";
import {
  Box,
  Flex,
  Image as ChakraImage,
  Text,
  Input as ChakraInput,
  Button as ChakraButton,
  Link as ChakraLink,
  Alert,
  AlertIcon,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  IconButton,
  Button,
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from "@chakra-ui/react";
import { Link } from "react-router-dom";
import logo from "@/assets/images/sotbell-new-logo.png";
import girlimg from "@/assets/images/auth-banner.webp";
import { LoadingButton } from "@/components/atoms";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useAuth } from "@/context/AuthContext";

const VerifyOTPModal = ({
  visible,
  onCancel,
  setModalType = () => { },
  onVerify,
  isLoading,
}) => {
  const { verifyOTP, sendOTP, loading, error, clearError } = useAuth();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const otpInputRef = useRef(null);
  const [timer, setTimer] = useState(30);
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [loginData, setLoginData] = useState(null);
  const [uiError, setUiError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const effectiveLoading = isLoading || isVerifying;
  const otpValue = otp.join("");

  const mapOtpError = (err) => {
    const status = err?.response?.status;
    const code = err?.response?.data?.status_code || err?.code;
    const rawMsg = typeof err === "string" ? err : err?.response?.data?.message || err?.message || "";
    const msg = rawMsg.toLowerCase();

    if (status === 401 || msg.includes("invalid") || msg.includes("mismatch")) return "Please check the 6-digit OTP and try again.";
    if (status === 400 && (msg.includes("expired") || msg.includes("timeout"))) return "Your OTP has expired. Tap “Resend OTP” to get a new one.";
    if (status === 429 || msg.includes("too many")) return "Too many attempts. Please wait a minute and try again.";
    if (status === 403) return "Verification is blocked for this session. Please resend a new OTP.";
    if (status >= 500) return "We’re having trouble on our side. Please try again in a moment.";
    if (rawMsg.toLowerCase().includes("network") || code === "ECONNABORTED") return "No internet? Check your connection and try again.";
    return "We couldn’t verify that code. Please try again or resend a new OTP.";
  };

  useEffect(() => {
    if (!error) return;
    setUiError(mapOtpError(error));
  }, [error]);

  useEffect(() => {
    if (!visible || isMobile) return;
    const scrollY = window.scrollY || 0;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow || "";
      document.body.style.overflow = prevBodyOverflow || "";
      window.scrollTo(0, scrollY);
    };
  }, [visible, isMobile]);

  useEffect(() => {
    try {
      const data = JSON.parse(localStorage.getItem(LOCAL_KEYS.LOGIN_DATA) || "{}");
      setLoginData(data || null);
    } catch {
      setLoginData(null);
    }
  }, []);

  useEffect(() => {
    if (timer <= 0) return;
    const iv = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [timer]);

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    const arr = value.split("");

    setOTP([
      arr[0] || "",
      arr[1] || "",
      arr[2] || "",
      arr[3] || "",
      arr[4] || "",
      arr[5] || "",
    ]);
    setActiveIndex(arr.length); // ✅ move cursor
  };

  useEffect(() => {
    if (!visible) return;

    const t = setTimeout(() => {
      otpInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(t);
  }, [visible]);

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    const value = pasted.slice(0, 6);
    const arr = value.split("");
    setOTP([
  arr[0] || "",
  arr[1] || "",
  arr[2] || "",
  arr[3] || "",
  arr[4] || "",
  arr[5] || "",
]);
    setUiError("");
    clearError?.();
  };

  useEffect(() => {
    if (otp.join("").length === 6) {
      validateOTP();
    }
  }, [otp]);

  const handleClose = () => {
    setModalType("");
    onCancel?.();
  };

  const validateOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) return;

    try {
      setIsVerifying(true);
      clearError?.();
      setUiError("");

      const res = await verifyOTP(code);

      if (res?.success) {
        localStorage.removeItem(LOCAL_KEYS.LOGIN_DATA);
        setModalType("");
        if (typeof onVerify === "function") {
          onVerify();
        }
      }
    } catch (err) {
      setUiError(mapOtpError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setOTP(["", "", "", "", "", ""]);
    setActiveIndex(0);
    setTimer(30);
    setUiError("");

    try {
      clearError?.();
      const userIdentifier = loginData?.phoneNumber || loginData?.email;
      if (!userIdentifier) throw new Error("Missing contact info for OTP resend");

      await sendOTP(userIdentifier);

      setTimeout(() => {
        otpInputRef.current?.focus();
      }, 0);
    } catch (err) {
      setUiError(
        mapOtpError(err) || "We couldn’t send the OTP right now. Please try again shortly."
      );
    }
  };

  const formContent = (
    <Box w="full" px={0} py={0}>
      <Flex direction="column" align="center" justify="center" h="full" w="full" maxW="400px" mx="auto">
        <ChakraImage src={logo} alt="Logo" maxH="35px" objectFit="contain" mb={6} mt={2} />


        <Box textAlign="center" mb={8} w="full">
          <Text fontSize="2xl" fontWeight="600" letterSpacing="tight" color="gray.900" mb={2}>
            OTP Verification
          </Text>
          <Text fontSize="sm" color="gray.500" letterSpacing="wide">
            Enter OTP received on
          </Text>
        </Box>

        <Flex align="center" justify="center" mt={1} mb={4} fontSize="sm" fontWeight="medium" gap={2}>
          <Text>{loginData?.phoneNumber ? `+${loginData.phoneNumber}` : (loginData?.email || "")}</Text>
          <Box as="button" type="button" onClick={() => setModalType("LOGIN")} aria-label="Edit" bg="transparent" border="none" cursor="pointer">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M8.20974 2.26684C8.64444 1.79587 8.86179 1.56039 9.09273 1.42303C9.64999 1.0916 10.3362 1.08129 10.9028 1.39585C11.1376 1.52621 11.3616 1.75506 11.8097 2.21277C12.2577 2.67048 12.4818 2.89933 12.6094 3.1392C12.9173 3.71798 12.9072 4.41895 12.5828 4.98823C12.4483 5.22417 12.2178 5.4462 11.7568 5.89024L6.27127 11.1737C5.3976 12.0152 4.96075 12.4359 4.41478 12.6492C3.86882 12.8624 3.26862 12.8467 2.06821 12.8153L1.90489 12.8111C1.53945 12.8015 1.35672 12.7967 1.25051 12.6762C1.14429 12.5556 1.15879 12.3695 1.1878 11.9973L1.20355 11.7952C1.28517 10.7474 1.32598 10.2235 1.53058 9.75261C1.73517 9.28168 2.08809 8.89937 2.79392 8.13462L8.20974 2.26684Z" stroke="black" />
              <path d="M7.58325 2.33301L11.6666 6.41634" stroke="black" />
              <path d="M8.16675 12.833H12.8334" stroke="black" />
            </svg>
          </Box>
        </Flex>

        {uiError && (
          <Box w="100%" mt={3} mb={2}>
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">{uiError}</Text>
            </Alert>
          </Box>
        )}

        <Box as="form" onSubmit={validateOTP} w="full">
          <Flex justify="center" gap={3} mt={4} mb={6} position="relative"
            onClick={() => otpInputRef.current?.focus()}>
            {[0, 1, 2, 3, 4, 5].map((idx) => (
              <Box
                key={idx}
                w="50px"
                h="60px"
                bg="gray.50"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                border="1px solid"
                transition="all 0.2s"
                _focusWithin={{ borderColor: "black", boxShadow: "0 0 0 1px black" }}
                borderColor={
                  activeIndex === idx
                    ? "black"   // ✅ active box
                    : otp[idx]
                      ? "black"
                      : "gray.200"
                }
              >
                <Text fontSize="xl" fontWeight="600">
                  {otp[idx] || (activeIndex === idx ? "|" : "")}
                </Text>
              </Box>
            ))}
            <ChakraInput
              ref={otpInputRef}
              position="absolute"
              opacity={0}
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otpValue}
              onChange={handleOtpChange}
              onPaste={handlePaste}
              h="55px"
              w={{ base: "330px", lg: "330px" }}
              zIndex={10}
              onKeyDown={(e) => {
                if (e.key === "Enter") validateOTP(e);
              }}
            />
          </Flex>

          <Box textAlign="center" mb={6}>
            {timer === 0 ? (
              <Flex justify="center">
                <Button
                  variant="link"
                  fontSize="sm"
                  color="gray.600"
                  onClick={handleResend}
                >
                  Resend OTP
                </Button>
              </Flex>
            ) : (
              <Box>
                <Text fontSize="sm" color="gray.500">Resend OTP in {timer} Sec</Text>
              </Box>
            )}
          </Box>

          <Box mt={2}>
            <Button
              type="submit"
              bg={String(otpValue).length === 6 ? "black" : "gray.200"}
              color={String(otpValue).length === 6 ? "white" : "gray.500"}
              isDisabled={String(otpValue).length < 6 || isVerifying}
              isLoading={isVerifying}
              loadingText="Verifying..."
              h="54px"
              w="full"
              fontSize="md"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="widest"
              borderRadius="md"
              _hover={{ bg: String(otpValue).length === 6 ? "gray.800" : "gray.200" }}
              _active={{ transform: String(otpValue).length === 6 ? "scale(0.98)" : "none" }}
              transition="all 0.2s"
            >
              Submit
            </Button>
          </Box>

          <Flex mt={6} align="center" justify="center" pt={4} borderTop="1px solid" borderColor="gray.100" w="full">
            <Text fontSize="xs" color="gray.400" textAlign="center" lineHeight="tall">
              By continuing, you agree to Sötbella's<br />
              <Text as="span" color="gray.600" textDecoration="underline" cursor="pointer">Terms of Service</Text> & <Text as="span" color="gray.600" textDecoration="underline" cursor="pointer">Privacy Policy</Text>
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer placement="bottom" onClose={onCancel} isOpen={visible}>
        <DrawerOverlay />
        <DrawerContent borderTopRadius="3xl" pb={8} pt={2} minH="50vh" bg="white" boxShadow="0 -10px 40px rgba(0,0,0,0.1)">
          {/* Drag Handle */}
          <Flex justify="center" pt={2} pb={4}>
            {/* <Box w="40px" h="5px" bg="gray.300" borderRadius="full" /> */}
          </Flex>

          <Box position="absolute" top={4} right={4} zIndex={2}>
            <IconButton
              icon={
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              }
              variant="ghost"
              borderRadius="full"
              minW="auto"
              h="auto"
              p={2}
              _hover={{ bg: "gray.100" }}
              onClick={onCancel}
            />
          </Box>
          <DrawerBody px={6} display="flex" flexDirection="column" alignItems="center">
            {formContent}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop Full Screen Modal
  return (
    <ChakraModal isOpen={visible} onClose={handleClose} size="full" motionPreset="none">
      <ModalOverlay />
      <ModalContent p={0} m={0} borderRadius={0}>
        <ModalBody p={0}>
          <Box h="100vh" w="full" overflow="hidden" position="relative">
            <Flex w="full" h="inherit" flexDirection="row">

              {/* Left Image */}
              <Box w="50%" h="inherit">
                <ChakraImage src={girlimg} alt="Login Visual" h="full" w="full" objectFit="cover" objectPosition="top" />
              </Box>

              {/* Right Form */}
              <Box
                w="50%"
                h="inherit"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                position="relative"
                bg="white"
              >
                {formContent}

                <IconButton
                  position="absolute"
                  right="15px"
                  top="15px"
                  w="40px"
                  h="40px"
                  borderRadius="50%"
                  bg="#f3f3f3"
                  onClick={handleClose}
                  aria-label="Close"
                  _hover={{ bg: "#e0e0e0" }}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 12 12" fill="none">
                      <path d="M10.6671 1.33301L1.33374 10.6664M1.33374 1.33301L10.6671 10.6664" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  }
                />
              </Box>
            </Flex>
          </Box>
        </ModalBody>
      </ModalContent>
    </ChakraModal>
  );
};

export default VerifyOTPModal;
