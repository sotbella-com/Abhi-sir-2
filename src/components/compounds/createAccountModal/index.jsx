import { useEffect, useState, useRef } from "react";
import { Modal as AntdModal, DatePicker } from "antd";
import {
  Box,
  Heading,
  Input as CInput,
  Select as CSelect,
  Text,
  Link as CLink,
  FormControl,
  FormLabel,
  InputGroup,
  InputLeftAddon,
  FormErrorMessage,
  Alert,
  AlertIcon,
  Image as ChakraImage,
  Flex,
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
import dayjs from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { LoadingButton } from "@/components/atoms";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import InFlag from "@/assets/images/flag/INflag.jpg";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import logo from "@/assets/images/sotbell-new-logo.png";
import girlimg from "@/assets/images/auth-banner.webp";
import { Link } from "react-router-dom";

/* ---------------------- helper: friendly backend errors ---------------------- */

const isConflict409 = (e) => {
  const status = e?.response?.status ?? e?.status ?? e?.code;
  if (Number(status) === 409) return true;

  const msg = String(
    e?.response?.data?.message ||
    e?.response?.data?.error ||
    e?.message ||
    e ||
    ""
  ).toLowerCase();

  return (
    msg.includes("409") ||
    msg.includes("conflict") ||
    msg.includes("two concurrent requests")
  );
};

const parseFriendlyError = (raw) => {
  if (!raw) return null;
  const msg = String(raw);

  if (/email.*exist|already.*registered/i.test(msg))
    return "This mobile/email is already registered.";
  if (/login.*exist|customer.*exists/i.test(msg))
    return "An account already exists for this mobile/email.";
  if (/bad request/i.test(msg))
    return "We couldn’t process your request. Please check the fields and try again.";
  if (/required|missing/i.test(msg))
    return "Please fill in all required fields.";
  if (/timeout|network|fetch failed/i.test(msg))
    return "Network issue. Please try again.";
  try {
    const m = msg.match(/"detail":"([^"]+)"/);
    if (m && m[1]) return m[1];
  } catch { }
  return "Something went wrong. Please try again.";
};

const nameRe = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* ----------------------- Same Calendar icon as CreateAccount ---------------- */
const CalendarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1.33203V2.66536M4 1.33203V2.66536" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.9996 8.66797H8.0056M7.9996 11.3346H8.0056M10.6633 8.66797H10.6693M5.33594 8.66797H5.34192M5.33594 11.3346H5.34192" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.33594 5.33203H13.6693" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.66406 8.16213C1.66406 5.25729 1.66406 3.80485 2.49881 2.90243C3.33356 2 4.67706 2 7.36406 2H8.63073C11.3177 2 12.6613 2 13.496 2.90243C14.3307 3.80485 14.3307 5.25729 14.3307 8.16213V8.50453C14.3307 11.4094 14.3307 12.8618 13.496 13.7643C12.6613 14.6667 11.3177 14.6667 8.63073 14.6667H7.36406C4.67706 14.6667 3.33356 14.6667 2.49881 13.7643C1.66406 12.8618 1.66406 11.4094 1.66406 8.50453V8.16213Z" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 5.33203H14" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const CreateAccountModal = ({
  open: visible,
  onCancel,
  onConfirm = () => { },
  setModalType = () => { },
  email,
}) => {
  const { createUser, sendOTP, checkUserExists, loading, error, clearError } = useAuth();
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const [phoneCode, setPhoneCode] = useState("+91");
  const [selectedCountryCode, setSelectedCountryCode] = useState("in");
  const [dobOpen, setDobOpen] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    dob: "",
    gender: "",
    email: "",
  });

  const [errors, setErrors] = useState({});
  const [topError, setTopError] = useState(null);
  const [showLoginLink, setShowLoginLink] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhoneCode("+91");
    setSelectedCountryCode("in");
    let initialEmail = "";
    if (email && String(email).trim()) {
      initialEmail = String(email).trim();
    } else {
      try {
        const raw = localStorage.getItem(LOCAL_KEYS.LOGIN_DATA);
        const parsed = raw ? JSON.parse(raw) : {};
        if (parsed?.email) initialEmail = String(parsed.email).trim();
      } catch { }
    }

    setFormData((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      phone: prev.phone || "",
      dob: "",
      gender: "",
      email: initialEmail,
    }));
    setErrors({});
    setTopError(null);
    setShowLoginLink(false);
  }, [visible, email]);

  const CONFLICT_MESSAGE = "If you already have an account, please log in. To register with a new email, try again after 1 hour.";

  useEffect(() => {
    if (!error) return;

    if (isConflict409(error)) {
      setTopError(CONFLICT_MESSAGE);
      setShowLoginLink(true);
    } else {
      setTopError(
        parseFriendlyError(typeof error === "string" ? error : (error?.message || error))
      );
      setShowLoginLink(false);
    }
    clearError?.();
  }, [error, clearError]);

  const validateFirst = (v) => {
    const t = String(v || "").trim();
    if (!t) return "First name is required.";
    if (t.length < 3) return "Minimum 3 characters.";
    if (!nameRe.test(t)) return "Only letters and single spaces allowed.";
    return "";
  };

  const validateLast = (v) => {
    const t = String(v || "").trim();
    if (!t) return "Last name is required.";
    if (t.length < 3) return "Minimum 3 characters.";
    if (!nameRe.test(t)) return "Only letters and single spaces allowed.";
    return "";
  };

  const validatePhone = (v) => {
    const d = String(v || "").replace(/\D/g, "");
    if (!d) return "Phone number is required.";
    if (d.length < 9 || d.length > 12) return "Enter a 9-12 digit mobile number.";
    return "";
  };

  const validateDob = (v) => {
    if (!v) return "";
    if (dayjs(v).isAfter(dayjs(), "day")) return "DOB cannot be in the future.";
    return "";
  };

  const validateEmail = (v) => {
    const t = String(v || "").trim();
    if (!t) return "Email is required.";
    if (!emailRe.test(t)) return "Please enter a valid email address.";
    return "";
  };

  const validateAll = () => {
    const next = {
      email: validateEmail(formData.email),
      firstName: validateFirst(formData.firstName),
      lastName: validateLast(formData.lastName),
      phone: validatePhone(formData.phone),
      dob: validateDob(formData.dob),
    };
    setErrors(next);
    return next;
  };

  const setField = (name, value) => {
    setTopError(null);
    setShowLoginLink(false);
    setFormData((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: "" }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "phone") {
      const clean = value.replace(/\D/g, "").slice(0, 12);
      setField("phone", clean);
      setErrors((p) => ({ ...p, phone: validatePhone(clean) }));
      return;
    }

    if (name === "email") {
      setTopError(null);
      setShowLoginLink(false);
      setFormData((p) => ({ ...p, email: value }));
      setErrors((p) => ({ ...p, email: validateEmail(value) }));
      return;
    }

    setField(name, value);
    if (name === "firstName") setErrors((p) => ({ ...p, firstName: validateFirst(value) }));
    if (name === "lastName") setErrors((p) => ({ ...p, lastName: validateLast(value) }));
    if (name === "email") setErrors((p) => ({ ...p, email: validateEmail(value) }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (name === "firstName") setErrors((p) => ({ ...p, firstName: validateFirst(value) }));
    if (name === "lastName") setErrors((p) => ({ ...p, lastName: validateLast(value) }));
    if (name === "email") setErrors((p) => ({ ...p, email: validateEmail(value) }));
    if (name === "phone") setErrors((p) => ({ ...p, phone: validatePhone(value) }));
  };

  const handleDateChange = (date, dateString) => {
    setField("dob", dateString);
    setErrors((p) => ({ ...p, dob: validateDob(dateString) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const next = validateAll();

    const cleanEmail = String(formData.email || "").trim();

    if (!cleanEmail || !formData.firstName || !formData.lastName || !formData.phone) {
      setTopError("Please fill all required fields.");
      return;
    }

    if (Object.values(next).some(Boolean)) {
      setTopError("Please fix the highlighted fields.");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    const cc = phoneCode.startsWith("+") ? phoneCode : `+${phoneCode}`;
    const fullPhone = `${cc}${cleanPhone}`;

    try {
      setTopError(null);
      clearError?.();

      const res = await createUser({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: fullPhone,
        email: cleanEmail,
        birthday: formData.dob || "",
        password: "Cyntexa@123",
      });

      if (res?.success) {
        setTimeout(async () => {
          try {
            const otpRes = await sendOTP(cleanEmail);
            if (otpRes?.success) {
              localStorage.setItem(LOCAL_KEYS.LOGIN_DATA, JSON.stringify({ email: cleanEmail, type: "email" }));
              setModalType("OTP");
              onConfirm("SUCCESS");
            } else {
              setTopError("We couldn’t send the verification code. Please try logging in.");
              setModalType("LOGIN");
            }
          } catch {
            setTopError("Account created but verification failed. Please try logging in.");
            setModalType("LOGIN");
          }
        }, 800);
      }
    } catch (err) {
      if (isConflict409(err)) {
        setTopError(CONFLICT_MESSAGE);
        setShowLoginLink(true);
        return;
      }
      setTopError(
        parseFriendlyError(err?.response?.data?.message || err?.message || err) ||
        "Unable to create account. Please try again."
      );
      setShowLoginLink(false);
    }
  };

  const formContent = (
    <Box w="full" px={4} py={{ base: 4, lg: 8 }}>
      <Flex direction="column" h="full" w="full" maxW="400px" mx="auto">
        <ChakraImage src={logo} alt="Logo" w="140px" mb={{ base: 6, lg: 8 }} alignSelf="center" />

        <Box textAlign="center" mb={4}>
          <Heading as="h4" size="md">Create an Account</Heading>
        </Box>

        {topError && (
          <Alert status="error" mb={4} borderRadius="md" alignItems="flex-start">
            <AlertIcon mt="2px" />
            <Box>
              <Text fontSize="sm">{topError}</Text>
              {showLoginLink && (
                <CLink
                  mt={1}
                  display="inline-block"
                  fontSize="sm"
                  fontWeight="semibold"
                  textDecoration="underline"
                  _hover={{ textDecoration: "underline", color: "black" }}
                  onClick={() => setModalType("LOGIN")}
                >
                  Go to Login
                </CLink>
              )}
            </Box>
          </Alert>
        )}

        <Box as="form" onSubmit={handleSubmit} display="flex" flexDirection="column" gap={4}>
          <FormControl isRequired isInvalid={!!errors.firstName}>
            <FormLabel fontSize="sm" mb={1}>First Name</FormLabel>
            <CInput
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="First Name"
              type="text"
              maxLength={30}
              fontSize="sm"
              h="45px"
              borderRadius="md"
              borderColor={errors.firstName ? "red.400" : "blackAlpha.400"}
              _hover={{ boxShadow: "none", borderColor: "black" }}
              _focusVisible={{ boxShadow: "none", borderColor: "black" }}
              _placeholder={{ color: "blackAlpha.600" }}
            />
            <FormErrorMessage>{errors.firstName}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.lastName}>
            <FormLabel fontSize="sm" mb={1}>Last Name</FormLabel>
            <CInput
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Last Name"
              type="text"
              maxLength={30}
              fontSize="sm"
              h="45px"
              borderRadius="md"
              borderColor={errors.lastName ? "red.400" : "blackAlpha.400"}
              _hover={{ boxShadow: "none", borderColor: "black" }}
              _focusVisible={{ boxShadow: "none", borderColor: "black" }}
            />
            <FormErrorMessage>{errors.lastName}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.email}>
            <FormLabel fontSize="sm" mb={1}>Email</FormLabel>
            <CInput
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Enter Email Address"
              fontSize="sm"
              h="45px"
              borderRadius="md"
              borderColor={errors.email ? "red.400" : "blackAlpha.400"}
              _hover={{ boxShadow: "none", borderColor: "black" }}
              _focusVisible={{ boxShadow: "none", borderColor: "black" }}
            />
            <FormErrorMessage>{errors.email}</FormErrorMessage>
          </FormControl>

          <FormControl isRequired isInvalid={!!errors.phone}>
            <FormLabel fontSize="sm" mb={1}>Phone Number</FormLabel>
            <Flex
              border="1px solid"
              borderColor={errors.phone ? "red.400" : "blackAlpha.400"}
              borderRadius="md"
              overflow="hidden"
            >
              <Box w="90px" flexShrink={0}>
                <PhoneInput
                  country={selectedCountryCode}
                  value={phoneCode}
                  onChange={(v, c) => {
                    const next = v.startsWith("+") ? v : `+${v}`;
                    setPhoneCode(next);
                    if (c?.countryCode) setSelectedCountryCode(c.countryCode);
                  }}
                  enableSearch
                  inputStyle={{ width: "100%", height: "45px", borderRadius: 0, border: 0, backgroundColor: "rgba(0,0,0,0.05)", fontSize: "14px" }}
                  buttonStyle={{ borderRadius: 0, border: 0, backgroundColor: "#f5f5f5" }}
                  countryCodeEditable={false}
                  autoFormat
                  readOnly
                />
              </Box>
              <Box w="full" px={2} display="flex" alignItems="center">
                <CInput
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Phone number"
                  type="tel"
                  inputMode="numeric"
                  maxLength={12}
                  fontSize="sm"
                  variant="unstyled"
                  h="45px"
                />
              </Box>
            </Flex>
            <FormErrorMessage>{errors.phone}</FormErrorMessage>
          </FormControl>

          <FormControl isInvalid={!!errors.dob}>
            <FormLabel fontSize="sm" mb={1}>Date of Birth</FormLabel>
            <Box
              w="full"
              border="1px solid"
              borderColor={errors.dob ? "red.400" : "blackAlpha.400"}
              h="45px"
              py={2}
              borderRadius="md"
            >
              <DatePicker
                value={formData.dob ? dayjs(formData.dob) : null}
                onChange={handleDateChange}
                placeholder="Date of Birth (optional)"
                format="YYYY-MM-DD"
                maxDate={dayjs()}
                suffixIcon={<CalendarIcon />}
                style={{ width: "100%", height: "100%", border: 0, paddingLeft: 12 }}
                inputReadOnly
                open={dobOpen}
                onOpenChange={setDobOpen}
                onClick={() => setDobOpen(true)}
                allowClear={false}
              />
            </Box>
            <FormErrorMessage>{errors.dob}</FormErrorMessage>
          </FormControl>

          <Button
            type="submit"
            bg="black"
            color="white"
            isDisabled={loading}
            isLoading={loading}
            loadingText="Creating..."
            h="54px"
            w="full"
            fontSize="md"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="widest"
            borderRadius="md"
            _hover={{ bg: "gray.800" }}
            _active={{ transform: "scale(0.98)" }}
            transition="all 0.2s"
          >
            Submit
          </Button>

          <Flex mt={6} align="center" justify="center" pt={4} borderTop="1px solid" borderColor="gray.100" w="full">
            <Text fontSize="xs" color="gray.400" textAlign="center" lineHeight="tall">
              By continuing, you agree to Sötbella's<br/>
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
        <DrawerContent borderTopRadius="3xl" pb={8} pt={2} minH="70vh" bg="white" boxShadow="0 -10px 40px rgba(0,0,0,0.1)">
          {/* Drag Handle */}
          <Flex justify="center" pt={2} pb={4}>
            <Box w="40px" h="5px" bg="gray.300" borderRadius="full" />
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

  // Desktop View
  return (
    <ChakraModal isOpen={visible} onClose={onCancel} size="full" motionPreset="none">
      <ModalOverlay />
      <ModalContent p={0} m={0} borderRadius={0}>
        <ModalBody p={0}>
          <Box h="100vh" w="full" overflow="hidden" position="relative">
            <Flex w="full" h="inherit" flexDirection="row">
              <Box w="50%" h="inherit">
                <ChakraImage src={girlimg} alt="Login Visual" h="full" w="full" objectFit="cover" objectPosition="top" />
              </Box>

              <Box w="50%" h="inherit" display="flex" flexDirection="column" overflowY="auto" position="relative" bg="white">
                {formContent}

                <IconButton
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

export default CreateAccountModal;
