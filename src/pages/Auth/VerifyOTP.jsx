import { Fragment, useRef, useState, useEffect } from "react";
import girlimg from "@/assets/images/auth-banner.webp";
import logo from "@/assets/images/sotbell-new-logo.png";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoadingButton } from "@/components/atoms";
import { toast } from "react-toastify";
import {
  Box,
  Flex,
  Image as ChakraImage,
  Text,
  Input as ChakraInput,
  Link as ChakraLink,
  IconButton,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";

const VerifyOTP = () => {
  const navigate = useNavigate();
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)];
  const { verifyOTP,loginVerification, sendOTP, loading, error, clearError, isAuthenticated } = useAuth();
  const [uiError, setUiError] = useState("");
  const [loginData, setLoginData] = useState(null);
  const [timer, setTimer] = useState(30);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [otp, setOTP] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);

  const mapOtpError = (err) => {
    const status = err?.response?.status;
    const code = err?.response?.data?.status_code || err?.code;

    const rawMsg =
      typeof err === "string"
        ? err
        : err?.response?.data?.message || err?.message || "";

    const msg = rawMsg.toLowerCase();

    if (status === 401 || msg.includes("invalid") || msg.includes("mismatch")) {
      return "Please check the 4-digit OTP and try again.";
    }
    if (status === 400 && (msg.includes("expired") || msg.includes("timeout"))) {
      return "Your OTP has expired. Tap “Resend OTP” to get a new one.";
    }
    if (status === 429 || msg.includes("too many")) {
      return "Too many attempts. Please wait a minute and try again.";
    }
    if (status === 403) {
      return "Verification is blocked for this session. Please resend a new OTP.";
    }
    if (status >= 500) {
      return "We’re having trouble on our side. Please try again in a moment.";
    }
    if (rawMsg.toLowerCase().includes("network") || code === "ECONNABORTED") {
      return "No internet? Check your connection and try again.";
    }

    // Default
    return "We couldn’t verify that code. Please try again or resend a new OTP.";
  };


  useEffect(() => {
    const loginDataFromLocalStorage = JSON.parse(
      localStorage.getItem(LOCAL_KEYS.LOGIN_DATA)
    );
    if (loginDataFromLocalStorage) {
      setLoginData(loginDataFromLocalStorage);
    } else {
      navigate("/main-login");
    }
  }, [navigate]);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  const validateOTP = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    if (otp.join("").length !== 6) {
      setUiError("Please enter the 6-digit OTP sent to your phone.");
      return;
    }

    try {
      setIsVerifying(true);
      clearError();
      setUiError("");
      const response = await verifyOTP(otp.join(""));

      if (response.success) {
        // toast.success("OTP verified successfully");
        localStorage.removeItem(LOCAL_KEYS.LOGIN_DATA);
        navigate("/");
      }
    } catch (err) {
      setUiError(mapOtpError(err));
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    if (!error) return;
    setUiError(mapOtpError(error)); // error can be an axios error or a string
  }, [error]);

  const handleResendOtp = async () => {
    setOTP(["", "", "", "", "", ""]);
    otpRefs[0].current?.focus();
    setTimer(30);
    setIsTimerRunning(true);
    setUiError("");                        // clear error when resending

    try {
      clearError();
      const response = await sendOTP(loginData?.phoneNumber);
      if (response.success) {
        // toast.success("We’ve sent you a new OTP.");
      }
    } catch (err) {
      setUiError(
        mapOtpError(err) ||
        "We couldn’t send the OTP right now. Please try again shortly."
      );
    }
  };

  useEffect(() => {
    const interval =
      timer > 0 ? setInterval(() => setTimer((prev) => prev - 1), 1000) : null;
    if (timer === 0) setIsTimerRunning(false);
    return () => clearInterval(interval);
  }, [timer]);

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (pasted.length === 6) {
      const newOtp = pasted.split("").slice(0, 6);
      setOTP(newOtp);
      otpRefs[5].current?.focus();
    }
  };

  useEffect(() => {
    if (otp.join("").length === 6) {
      validateOTP(new Event("submit"));
    }
  }, [otp]); // eslint-disable-line

  return (
    <Fragment>
      <Box h={{ base: "100dvh", md: "100vh" }} display="grid" placeItems="center" overflow="hidden">
        <Flex w="full" h="inherit">
          {/* Left side image (desktop only) */}
          <Box display={{ base: "none", lg: "block" }} w={{ lg: "50%" }} p={0}>
            <ChakraImage
              src={girlimg}
              alt="OTP Visual"
              h="100%"
              w="100%"
              objectFit="cover"
              objectPosition="top"
            />
          </Box>

          {/* OTP Form Section */}
          <Flex
            w={{ lg: "50%" }}
            p={0}
            direction="column"
            justify="center"
            align="center"
            mx="auto"
            position="relative"
            mt={{ base: -10, lg: 0 }}
          >
            <Box mx="auto" w="75%" maxW="400px">
              {/* Mobile back arrow was commented out in original */}

              <Box textAlign="center" mb={4}>
                <ChakraImage src={logo} alt="Logo" mx={"auto"} />
              </Box>

              <Box textAlign="center" mb={4}>
                <Text fontSize="md" mb={1}>{`Verify your phone number`}</Text>
                <Text fontSize="12px" mb={2}>
                  Enter the OTP we sent to you via SMS
                </Text>

                <Box
                  my={4}
                >
                  <Flex
                    justify="center"
                    align="center"
                    fontSize="sm"
                    fontWeight="bold"
                  >
                    <Text as="span">
                      {loginData?.type == "phone"
                        ? (loginData?.phoneNumber ? "+91-" + loginData.phoneNumber : "Phone number not found")
                        : loginData?.email || "Email not found"}{" "}
                    </Text>
                    <Box
                      as="span"
                      onClick={() => navigate("/main-login")}
                      role="button"
                      ml={2}
                      cursor="pointer"
                      color="blue.500"
                      _hover={{ color: "blue.700" }}
                    >
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 14 14"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <g clipPath="url(#clip0_948_15665)">
                          <path
                            d="M8.20974 2.26684C8.64444 1.79587 8.86179 1.56039 9.09273 1.42303C9.64999 1.0916 10.3362 1.08129 10.9028 1.39585C11.1376 1.52621 11.3616 1.75506 11.8097 2.21277C12.2577 2.67048 12.4818 2.89933 12.6094 3.1392C12.9173 3.71798 12.9072 4.41895 12.5828 4.98823C12.4483 5.22417 12.2178 5.4462 11.7568 5.89024L6.27127 11.1737C5.3976 12.0152 4.96075 12.4359 4.41478 12.6492C3.86882 12.8624 3.26862 12.8467 2.06821 12.8153L1.90489 12.8111C1.53945 12.8015 1.35672 12.7967 1.25051 12.6762C1.14429 12.5556 1.15879 12.3695 1.1878 11.9973L1.20355 11.7952C1.28517 10.7474 1.32598 10.2235 1.53058 9.75261C1.73517 9.28168 2.08809 8.89937 2.79392 8.13462L8.20974 2.26684Z"
                            stroke="black"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M7.58325 2.33301L11.6666 6.41634"
                            stroke="black"
                            strokeLinejoin="round"
                          />
                          <path
                            d="M8.16675 12.833H12.8334"
                            stroke="black"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </g>
                        <defs>
                          <clipPath id="clip0_948_15665">
                            <rect width="14" height="14" fill="white" />
                          </clipPath>
                        </defs>
                      </svg>
                    </Box>
                  </Flex>
                </Box>

                {/* Error Display */}
                {uiError && (
                  <Alert status="error" mb={4} borderRadius="md">
                    <AlertIcon />
                    <Text fontSize="sm">{uiError}</Text>
                  </Alert>
                )}

                {/* OTP Form */}
                <Box as="form" onSubmit={validateOTP}>
                  {/* --- Mobile: single --- */}
                  <Box
                    // display={{ base: "block", lg: "none" }}
                    mb={{ base: 3, lg: 5 }}
                    onPaste={handlePaste}
                  >
                    <ChakraInput
                      type="tel"
                      inputMode="numeric"
                      maxLength={6}
                      value={otp.join("")}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                        const arr = v.split("");
                        setOTP([arr[0] || "", arr[1] || "", arr[2] || "", arr[3] || "", arr[4] || "",arr[5] || "",]);
                      }}
                      textAlign="center"
                      border="none"
                      borderBottom="1px solid"
                      borderRadius={0}
                      w="70%"
                      mx="auto"
                      h="3rem"
                      fontSize="lg"
                      _focus={{
                        boxShadow: "none",
                        outline: "none",
                        borderBottomColor: "black",
                      }}
                      _focusVisible={{
                        boxShadow: "none",
                        outline: "none",
                        borderBottomColor: "black",
                      }}
                      _hover={{
                        borderBottomColor: "black",
                        boxShadow: "none",
                      }}
                    />
                  </Box>
                  {/* --- Desktop / tablet --- */}
                  <Box textAlign="center" mb={{ base: 3, lg: 5 }}>
                    {timer === 0 ? (
                      <Box mb={{ base: 3, lg: 5 }}>
                        <Flex justify="center">
                          <Flex
                            as="button"
                            align="center"
                            gap={2}
                            cursor="pointer"
                            onClick={handleResendOtp}
                            role="button"
                            bg="transparent"
                            border="none"
                            p={0}
                            pb="2px"
                            borderBottom="1.5px solid"
                            borderColor="#000"
                          >
                            {/* Icon */}
                            <Box as="span" display="flex">
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M8.66406 12H5.66406C4.00721 12 2.66406 10.6569 2.66406 9C2.66406 7.34313 4.00721 6 5.66406 6H13.3307"
                                  stroke="#333333"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M11.3359 8C11.3359 8 13.3359 6.527 13.3359 6C13.3359 5.47293 11.3359 4 11.3359 4"
                                  stroke="#333333"
                                  strokeWidth="1.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </Box>

                            {/* Text */}
                            <Text fontSize="sm" fontWeight="500" color="#000">
                              Resend OTP
                            </Text>
                          </Flex>
                        </Flex>
                      </Box>
                    ) : (
                      <>
                        <Text as="span" fontSize="12px">
                          RESEND OTP IN
                        </Text>
                        <Text
                          as="span"
                          fontSize="12px"
                          fontWeight="bold"
                          ml={1}
                        >
                          ({timer}s)
                        </Text>
                      </>
                    )}
                  </Box>

                  <Flex justify="center">
                    <LoadingButton
                      type="submit"
                      text="Verify OTP"
                      isLoading={isVerifying}
                      loadingText="Verifying OTP ..."
                      disabled={otp.join("").length !== 6}
                      borderRadius="0"
                    />
                  </Flex>
                </Box>

                <Flex justify="center" mt={3}>
                  <Text
                    m={0}
                    textAlign="center"
                    color="black"
                    fontSize="xs"
                    lineHeight="150%"
                    maxW="19em"
                    fontWeight="normal"
                  >
                    By continuing, you agree to our{" "}
                    <ChakraLink
                      as={RouterLink}
                      to="/terms"
                      borderBottom="1px solid"
                      borderColor="black"
                    >
                      Terms
                    </ChakraLink>{" "}
                    &{" "}
                    <ChakraLink
                      as={RouterLink}
                      to="/privacypolicy"
                      borderBottom="1px solid"
                      borderColor="black"
                    >
                      Privacy Policy
                    </ChakraLink>
                  </Text>
                </Flex>
              </Box>
            </Box>

            {/* Desktop close button */}
            <IconButton
              display={{ base: "none", lg: "flex" }}
              position="absolute"
              right="15px"
              top="15px"
              w="40px"
              h="40px"
              borderRadius="50%"
              bg="#f3f3f3"
              onClick={() => navigate("/main-login")}
              aria-label="Close"
              _hover={{ bg: "#e0e0e0" }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M10.6671 1.33301L1.33374 10.6664M1.33374 1.33301L10.6671 10.6664"
                  stroke="black"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </IconButton>
          </Flex>
        </Flex>
      </Box>
    </Fragment>
  );
};

export default VerifyOTP;