import React, { useState, Fragment, useEffect } from "react";
import { Modal as AntdModal, Typography } from "antd";
import {
  Box,
  Flex,
  Image as ChakraImage,
  Text,
  Input,
  Image,
  useBreakpointValue,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerBody,
  Button,
  IconButton,
  Divider,
  Modal as ChakraModal,
  ModalOverlay,
  ModalContent,
  ModalBody,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import logo from "@/assets/images/sotbell-new-logo.png";
import girlimg from "@/assets/images/auth-banner.webp";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoadingButton } from "@/components/atoms";
import { useAuth } from "@/context/AuthContext";
import InFlag from "@/assets/images/flag/INflag.jpg";
import { FcGoogle } from "react-icons/fc";
import { FaApple } from "react-icons/fa";

const { Title, Paragraph } = Typography;

const LoginModal = ({ visible, onCancel, setModalType, onNewUser, isHidden }) => {
  const [phone, setPhone] = useState("");
  const { checkUserExists, loading, clearError, error } = useAuth();
  const isMobile = useBreakpointValue({ base: true, lg: false });
  const navigate = useNavigate();

  const hiddenMode = isHidden === true || isHidden === "true";

  // lock scroll logic is still useful for desktop, though Drawer handles it for mobile
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
    if (!error) return;
    clearError?.();
  }, [error, clearError]);

  const showPreOrderModal = () => {
    setModalType("PREORDER");
  };

  const handleSendOTP = async () => {
    let clean = (phone || "").replace(/\D/g, "");
    if (!clean || clean.length !== 10) return;

    clean = `91${clean}`;

    try {
      clearError?.();

      const result = await checkUserExists(clean);

      console.log("checkUserExists result:", result);
      console.log("isHidden:", isHidden);

      localStorage.setItem(
        LOCAL_KEYS.LOGIN_DATA,
        JSON.stringify({ phoneNumber: clean, type: "phone" })
      );
      localStorage.setItem(LOCAL_KEYS.PHONE_NUMBER, clean);

      if (result?.success && result?.userExists) {
        setModalType("OTP");
        return;
      }

      const isUserNotFound =
        result?.status_code === "404 NOT_FOUND" ||
        result?.message === "User not found";

      if (hiddenMode && isUserNotFound) {
        showPreOrderModal();
        return;
      }

      if (onNewUser) {
        onCancel();
        onNewUser(clean);
      } else {
        setModalType("CREATE_ACCOUNT");
      }
    } catch (e) {
      console.log("checkUserExists error:", e);
      console.log("isHidden:", isHidden);

      const errorData =
        e?.response?.data ||
        e?.data ||
        e?.error ||
        e?.response ||
        e;

      const isUserNotFound =
        errorData?.status_code === "404 NOT_FOUND" ||
        errorData?.message === "User not found" ||
        e?.message === "User not found";

      if (hiddenMode && isUserNotFound) {
        showPreOrderModal();
        return;
      }
    }
  };

  // const handleAppleLogin = () => {
  //   // Placeholder for Apple Login
  // };

  // const handleGoogleLogin = () => {
  //   // Placeholder for Google Login
  // };

  if (isMobile) {
    return (
      <>
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

              <Box
                w="full"
                my={5}
                px={4}
                py={3}
                borderRadius="lg"
                bg="black"
                color="white"
                textAlign="center"
                position="relative"
                overflow="hidden"
              >
                {/* Subtle background pattern */}
                <Box
                  position="absolute"
                  inset={0}
                  opacity={0.05}
                  bg="radial-gradient(circle at 20% 50%, white 0%, transparent 60%)"
                />

                <Text
                  fontSize={{ base: "xs", lg: "md" }}
                  fontWeight="700"
                  letterSpacing="wide"
                >
                  GET EXTRA 10% OFF ON YOUR FIRST ORDER*
                </Text>

                <Text
                  fontSize={{ base: "10px", lg: "xs" }}
                  opacity={0.8}
                  letterSpacing="widest"
                  textTransform="uppercase"
                >
                  Sign up for more offers
                </Text>
              </Box>
              {/* Logo */}
              <Flex justify="center" mb={6} mt={2}>
                <ChakraImage src={logo} alt="Logo" maxH="35px" objectFit="contain" />
              </Flex>

              {/* Title */}
              <Box textAlign="center" mb={8} w="full">
                <Text fontSize="2xl" fontWeight="600" letterSpacing="tight" color="gray.900" mb={2}>
                  Welcome
                </Text>
                <Text fontSize="sm" color="gray.500" letterSpacing="wide">
                  Please enter your details to sign in
                </Text>
              </Box>

              {/* Input Stack */}
              <Box w="full" maxW="320px" display="flex" flexDirection="column" gap={5} mb={6}>
                <Box
                  border="1px solid"
                  borderColor={phone ? "black" : "gray.300"}
                  borderRadius="md"
                  overflow="hidden"
                  transition="all 0.2s"
                  _focusWithin={{ borderColor: "black", boxShadow: "0 0 0 1px black" }}
                >
                  <Flex align="center" h="54px">
                    <Box px={4} borderRight="1px solid" borderColor="gray.200" display="flex" alignItems="center" bg="gray.50" h="full">
                      <Text fontSize="sm" fontWeight="500" color="gray.600">+91</Text>
                    </Box>
                    <Input
                      type="tel"
                      placeholder="Enter Mobile Number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      flex="1"
                      h="full"
                      fontSize="md"
                      px={4}
                      border="none"
                      bg="white"
                      _focus={{ boxShadow: "none", bg: "white" }}
                      _placeholder={{ color: "gray.400" }}
                    />
                  </Flex>
                </Box>

                <Button
                  bg={phone.length === 10 ? "black" : "gray.200"}
                  color={phone.length === 10 ? "white" : "gray.500"}
                  onClick={handleSendOTP}
                  isDisabled={phone.length !== 10 || loading}
                  isLoading={loading}
                  h="54px"
                  w="full"
                  fontSize="md"
                  fontWeight="600"
                  textTransform="uppercase"
                  letterSpacing="widest"
                  borderRadius="md"
                  _hover={{ bg: phone.length === 10 ? "gray.800" : "gray.200" }}
                  _active={{ transform: phone.length === 10 ? "scale(0.98)" : "none" }}
                  transition="all 0.2s"
                >
                  Continue
                </Button>
              </Box>

              <Flex mt="auto" align="center" justify="center" pt={4} borderTop="1px solid" borderColor="gray.100" w="full">
                <Text fontSize="xs" color="gray.400" textAlign="center" lineHeight="tall">
                  By continuing, you agree to Sötbella's<br />
                  <Text as="span" color="gray.600" textDecoration="underline" cursor="pointer">Terms of Service</Text> & <Text as="span" color="gray.600" textDecoration="underline" cursor="pointer">Privacy Policy</Text>
                </Text>
              </Flex>

              {/* Social Logins */}
              {/* <Flex gap={3} w="full" mb={4}>
              <Button
                flex="1"
                variant="outline"
                leftIcon={<FaApple size={20} />}
                onClick={handleAppleLogin}
                borderRadius="md"
                borderColor="gray.300"
                h="44px"
              >
                Login Via
              </Button>
              <Button
                flex="1"
                variant="outline"
                leftIcon={<FcGoogle size={20} />}
                onClick={handleGoogleLogin}
                borderRadius="md"
                borderColor="gray.300"
                h="44px"
              >
                Login Via
              </Button>
            </Flex> */}

              {/* Email login fallback */}
              {/* <Box textAlign="center" mb={2}>
              <Text fontSize="sm" color="gray.600" textDecoration="underline" cursor="pointer" onClick={() => {
                // switch to email modal if needed later
              }}>
                 Use Email ID
              </Text>
            </Box> */}

            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop Full Screen Modal
  return (
    <ChakraModal isOpen={visible} onClose={onCancel} size="full" motionPreset="none">
      <ModalOverlay />
      <ModalContent p={0} m={0} borderRadius={0}>
        <ModalBody p={0}>
          <Box h="100vh" w="full" overflow="hidden" position="relative">
            <Flex w="full" h="inherit" flexDirection={{ base: "column", lg: "row" }}>

              {/* Left Image */}
              <Box display={{ base: "none", lg: "block" }} w={{ lg: "50%" }} h="inherit">
                <Image src={girlimg} alt="Login Visual" h="full" w="full" objectFit="cover" objectPosition="top" />
              </Box>

              {/* Right Form */}
              <Box
                w={{ base: "full", lg: "50%" }}
                h="inherit"
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                position="relative"
                bg="white"
              >
                <Box w="75%">
                  <Flex alignItems="center" justifyContent="center" mb={4}>
                    <Image src={logo} alt="Logo" className="img-fluid" maxH="50px" />
                  </Flex>
                  <Box textAlign="center" mb={4}>
                    <Text fontSize="22px">Login / Sign up</Text>
                  </Box>

                  <Box overflow="hidden">
                    <Flex alignItems="center" border="1px solid" borderColor="blackAlpha.300" h="50px" w="full">
                      <Flex px={3} alignItems="center" gap={2}>
                        <Image src={InFlag} alt="India Flag" boxSize="20px" w={5} h={4} />
                        <Text fontSize="sm" color="gray.700">+91</Text>
                      </Flex>
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        flex="1"
                        h="full"
                        fontSize="sm"
                        px={2}
                        border="none"
                        _focus={{ boxShadow: "none", borderColor: "black" }}
                        _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                        onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                      />
                    </Flex>
                  </Box>

                  <Box textAlign="center" mt={3}>
                    <LoadingButton
                      onClick={handleSendOTP}
                      disabled={phone.length === 0}
                      isLoading={loading}
                      loadingText="Sending OTP ..."
                      text="Send OTP"
                      borderRadius="0"
                      type="primary"
                      block
                      style={{ width: '100%', height: '50px' }}
                    />
                  </Box>

                  <Flex justifyContent="center" mt={3} textAlign="center">
                    <Text fontSize="14px" fontWeight="normal" color="black" lineHeight="1.5" maxW="19em" m={0}>
                      By proceeding, you agree to our{" "}
                      <Link to="/privacypolicy" style={{ borderBottom: "1px solid black" }}>Privacy Policy</Link>
                      {" "}and{" "}
                      <Link to="/terms" style={{ borderBottom: "1px solid black" }}>Terms of Use</Link>
                    </Text>
                  </Flex>
                </Box>

                <IconButton
                  display={{ base: "none", lg: "flex" }}
                  position="absolute"
                  right="15px"
                  top="15px"
                  w="40px"
                  h="40px"
                  borderRadius="50%"
                  bg="#f3f3f3"
                  onClick={onCancel}
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

export default LoginModal;