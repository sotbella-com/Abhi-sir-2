import { Fragment, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Flex,
  Image,
  Text,
  Input,
  IconButton,
  useBreakpointValue,
} from "@chakra-ui/react";
import girlimg from "@/assets/images/auth-banner.webp";
import sotbella from "@/assets/images/sotbell-new-logo.png";
import "react-phone-input-2/lib/style.css";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { LoadingButton } from "@/components/atoms";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";
import InFlag from "@/assets/images/flag/INflag.jpg";

const MainLoginPage = () => {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const { sendOTP, checkUserExists, loading, error, clearError } = useAuth();

  // 🔔 show auth errors as toast
  useEffect(() => {
    if (!error) return;
    const msg =
      typeof error === "string" ? error : error?.message || "Something went wrong";
    // toast.error(msg);
    // optional: clear so the toast doesn't repeat on re-render
    clearError?.();
  }, [error, clearError]);


  useEffect(() => {
    const loginDataFromLocalStorage = JSON?.parse(
      localStorage.getItem(LOCAL_KEYS.LOGIN_DATA)
    );
    // if (loginDataFromLocalStorage) {
    //   setEmail(loginDataFromLocalStorage?.email);
    // }
    localStorage.removeItem(LOCAL_KEYS.LOGIN_DATA);
  }, []);

  const onLogin = async () => {
    if (phoneNumber.length === 0) {
      // toast.error("Please enter phone number");
      return;
    }

    // Validate phone number (should be 10 digits)
    let cleanPhone = phoneNumber.replace(/\D/g, '');

    if (cleanPhone.length !== 10) {
      // toast.error("Please enter a valid 10-digit phone number");
      return;
    }

    if(cleanPhone.startsWith("91")){
      cleanPhone = "91" + cleanPhone;
    }

    try {
      clearError();

      // Check if user exists and send OTP if they do
      const result = await checkUserExists(cleanPhone);

      if (result.success && result.userExists) {
        // User exists and OTP sent successfully
        // toast.success("OTP sent successfully");
        localStorage.setItem(
          LOCAL_KEYS.LOGIN_DATA,
          JSON.stringify({ phoneNumber: cleanPhone, type: "phone" })
        );
        navigate("/verify-otp");
      } else {
        let updatedPhone = cleanPhone;

        if (updatedPhone.startsWith("+91")) {
          updatedPhone = updatedPhone.slice(3);
        } else if (updatedPhone.startsWith("91")) {
          updatedPhone = updatedPhone.slice(2);
        }
        navigate("/create-account", { state: { phoneNumber: updatedPhone } });
      }
    } catch (error) {
      // toast.error("Unable to process login. Please try again.");
    }
  };

  return (
    <Fragment>
      <Box
        h={{ base: "100dvh", md: "100vh" }}
        w="full"
        overflow="hidden"
      >
        <Flex
          w="full"
          h="inherit"
          flexDirection={{ base: "column", lg: "row" }}
        >
          {/* Left side image (desktop only) */}
          <Box display={{ base: "none", lg: "block" }} w={{ lg: "50%" }} h="inherit">
            <Image
              src={girlimg}
              alt="Login Visual"
              h="full"
              w="full"
              objectFit="cover"
              objectPosition="top"
            />
          </Box>

          {/* Right side login form */}
          <Box
            w={{ base: "full", lg: "50%" }}
            h="inherit"
            display="flex"
            flexDirection="column"
            justifyContent="center"
            alignItems="center"
            position="relative"
            py={{ base: 10, lg: 0 }}
          >
            <Box w="75%">

              {/* Logo */}
              <Flex alignItems="center" justifyContent="center" textAlign="center" mb={4}>
                <Image src={sotbella} alt="Logo" className="img-fluid" />
              </Flex>

              {/* Header */}
              <Box textAlign="center" mb={4}>
                <Text fontSize="22px">Login / Sign up</Text>
              </Box>

              {/* Phone Number Input */}
              <Box overflow="hidden">
                <Box bg="white"></Box>
                <Flex
                  alignItems="center"
                  border="1px solid"
                  borderColor="blackAlpha.300"
                  h="50px"
                  w="full"
                >
                  <Flex px={3} alignItems="center" gap={2}>
                    <Image src={InFlag} alt="India Flag" boxSize="20px" w={5} h={4} />
                    <Text fontSize="sm" color="gray.700">+91</Text>
                  </Flex>

                  <Input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhoneNumber(value);
                    }}
                    flex="1"
                    h="full"
                    fontSize="sm"
                    px={2}
                    border="none"
                    _focus={{ boxShadow: "none", borderColor: "black" }}
                    _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        onLogin();
                      }
                    }}
                  />
                </Flex>
              </Box>

              {/* Submit Button */}
              <Box textAlign="center" mt={3}>
                <LoadingButton
                  onClick={onLogin}
                  disabled={phoneNumber.length === 0}
                  isLoading={loading}
                  loadingText="Sending OTP ..."
                  text="Send OTP "
                  borderRadius="0"
                />
              </Box>

              {/* WhatsApp opt-in */}
              {/* <div className="form-check mt-3 d-flex justify-content-center align-items-center gap-2">
                <input
                  className="form-check-input m-0 custom-black-checkbox rounded-0"
                  type="checkbox"
                  id="whatsappOptIn"
                />

                <label
                  className="form-check-label"
                  style={{ fontSize: "12px" }}
                  htmlFor="whatsappOptIn"
                >
                  Opt in for important updates on WhatsApp
                </label>
              </div> */}
              <Flex justifyContent="center" mt={3} textAlign="center">
                <Text
                  fontSize="14px"
                  fontWeight="normal"
                  color="black"
                  lineHeight="1.5"
                  fontFamily="Lato, sans-serif"
                  maxW="19em"
                  m={0}
                >
                  By proceeding, you agree to shop&apos;s{" "}
                  <Link to="/privacypolicy" style={{ borderBottom: "1px solid black" }}>
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link to="/terms" style={{ borderBottom: "1px solid black" }}>
                    Terms of Use
                  </Link>
                </Text>
              </Flex>
            </Box>

            {/* Desktop close button */}
            <IconButton
              // display={{ base: "none", lg: "flex" }}
              position="absolute"
              right="15px"
              top="15px"
              w="40px"
              h="40px"
              borderRadius="50%"
              bg="#f3f3f3"
              // onClick={() => {
              //   navigate("/");
              //   window.location.reload();
              // }}
              onClick={() => window.history.back()}
              aria-label="Close"
              _hover={{ bg: "#e0e0e0" }}
              icon={
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
              }
            />
          </Box>
        </Flex>
      </Box>
    </Fragment>
  );
};

export default MainLoginPage;