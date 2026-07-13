import { useState, useRef, useEffect } from "react";
import { Link as RouterLink, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Flex,
  Image as ChakraImage,
  Text,
  Button,
  Input,
  Select as ChakraSelect,
  Link,
  IconButton,
  Alert,
  AlertIcon,
  FormControl,
  FormErrorMessage,
  Image,
} from "@chakra-ui/react";
import authBanner from "@/assets/images/auth-banner.webp";
import logo from "@/assets/images/sotbell-new-logo.png";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useAuth } from "@/context/AuthContext";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { useMobile } from "@/components/molecules";
import InFlag from "@/assets/images/flag/INflag.jpg";

const RadioRightBW = ({ checked }) => {
  return (
    <Box
      w="16px"
      h="16px"
      border="1.5px solid #000"
      borderRadius="50%"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="#fff"
      flex="0 0 auto"
    >
      <Box
        w="8px"
        h="8px"
        borderRadius="50%"
        bg={checked ? "#000" : "transparent"}
        transform={checked ? "scale(1)" : "scale(0.1)"}
        transition="transform 120ms ease-in-out, background 120ms ease-in-out"
      />
    </Box>
  );
};

const Chevron = ({ open }) => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 150ms ease" }}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M6 9l6 6 6-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const GenderSelectBW = ({
  value,                 // number | null
  onChange,              // (val:number) => void
  placeholder = "SELECT GENDER",
  options = [
    { label: "MALE", value: 0 },
    { label: "FEMALE", value: 1 },
    { label: "OTHERS", value: 2 },
  ],
  borderColor = "blackAlpha.500",
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  return (
    <Box ref={wrapRef} position="relative" w="full">
      {/* Trigger */}
      <Flex
        h="50px"
        px={3}
        border="1px solid"
        borderColor={borderColor}
        align="center"
        justify="space-between"
        cursor="pointer"
        onClick={() => setOpen((s) => !s)}
        bg="white"
      >
        <Text
          fontSize="12px"
          letterSpacing="0.02em"
          color={selected ? "#000" : "rgba(0,0,0,0.60)"}
          fontWeight="500"
        >
          {selected ? selected.label : placeholder}
        </Text>

        <Box display="flex" alignItems="center">
          <Chevron open={open} />
        </Box>
      </Flex>

      {/* Dropdown */}
      {open && (
        <Box
          position="absolute"
          left={0}
          right={0}
          top="calc(50px - 1px)"
          border="1px solid"
          borderColor={borderColor}
          bg="white"
          zIndex={20}
        >
          {options.map((opt) => {
            const checked = opt.value === value;
            return (
              <Flex
                key={opt.value}
                px={3}
                py={2}
                align="center"
                justify="space-between"
                cursor="pointer"
                _hover={{ bg: "blackAlpha.50" }}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Text fontSize="xs" fontWeight="600" color="#000">
                  {opt.label}
                </Text>
                <RadioRightBW checked={checked} />
              </Flex>
            );
          })}
        </Box>
      )}
    </Box>
  );
};


const CalendarIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 1.33203V2.66536M4 1.33203V2.66536" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M7.9996 8.66797H8.0056M7.9996 11.3346H8.0056M10.6633 8.66797H10.6693M5.33594 8.66797H5.34192M5.33594 11.3346H5.34192" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2.33594 5.33203H13.6693" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M1.66406 8.16213C1.66406 5.25729 1.66406 3.80485 2.49881 2.90243C3.33356 2 4.67706 2 7.36406 2H8.63073C11.3177 2 12.6613 2 13.496 2.90243C14.3307 3.80485 14.3307 5.25729 14.3307 8.16213V8.50453C14.3307 11.4094 14.3307 12.8618 13.496 13.7643C12.6613 14.6667 11.3177 14.6667 8.63073 14.6667H7.36406C4.67706 14.6667 3.33356 14.6667 2.49881 13.7643C1.66406 12.8618 1.66406 11.4094 1.66406 8.50453V8.16213Z" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M2 5.33203H14" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


/* -------------------------- helpers: friendly errors -------------------------- */
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const nameRe = /^[A-Za-z]+(?: [A-Za-z]+)*$/;

const parseFriendlyError = (raw) => {
  if (!raw) return null;
  const msg = String(raw);

  if (/email.*exist|already.*registered/i.test(msg)) return "This email is already registered.";
  if (/login.*exist|customer.*exists/i.test(msg)) return "An account already exists for this mobile/email.";
  if (/bad request/i.test(msg)) return "We couldn't process your request. Please check the fields and try again.";
  if (/invalid.*email/i.test(msg)) return "Please enter a valid email address.";
  if (/required|missing/i.test(msg)) return "Please fill in all required fields.";
  if (/rate limit|too many/i.test(msg)) return "Too many attempts. Please try again in a moment.";
  if (/timeout|network|fetch failed/i.test(msg)) return "Network issue. Please check your connection and try again.";

  try {
    const m = msg.match(/"detail":"([^"]+)"/);
    if (m && m[1]) return m[1];
  } catch { }

  return "Something went wrong. Please try again.";
};

/* ---------------------------------- page ---------------------------------- */
const CreateAccount = () => {
  const { createUser, sendOTP, loading, error, clearError, isAuthenticated } = useAuth();
  const [dobOpen, setDobOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    birthday: "",
    phoneNumber: "",
    gender: "",
  });

  // field-level + top errors
  const [fieldErrors, setFieldErrors] = useState({});
  const [topError, setTopError] = useState(null);

  /* ---------------------------- handle API errors ---------------------------- */
  useEffect(() => {
    if (error) {
      setTopError(parseFriendlyError(error));
      clearError?.();
    }
  }, [error, clearError]);

  /* -------------------------- prefill from login flow ------------------------ */
  useEffect(() => {
    if (location.state?.phoneNumber) {
      setFormData((prev) => ({ ...prev, phoneNumber: location.state.phoneNumber }));
    }
  }, [location.state]);

  /* ------------------------------- auth redirect ---------------------------- */
  useEffect(() => {
    if (isAuthenticated) navigate("/");
  }, [isAuthenticated, navigate]);

  /* -------------------------------- validators ------------------------------ */
  const validateFirstName = (v) => {
    const t = String(v || "").trim();
    if (!t) return "First name is required.";
    if (t.length < 3) return "Minimum 3 characters.";
    if (!nameRe.test(t)) return "Only letters and single spaces allowed.";
    return "";
  };

  const validateLastName = (v) => {
    const t = String(v || "").trim();
    if (!t) return "Last name is required.";
    if (t.length < 3) return "Minimum 3 characters.";
    if (!nameRe.test(t)) return "Only letters and single spaces allowed.";
    return "";
  };

  const validateEmail = (v) => {
    if (!v) return "Email is required.";
    if (!emailRe.test(String(v))) return "Please enter a valid email address.";
    return "";
  };

  const validatePhone = (v) => {
    const d = String(v || "").replace(/\D/g, "");
    if (!d) return "Phone number is required.";
    if (d.length !== 10) return "Enter a 10-digit mobile number.";
    return "";
  };

  const validateDOB = (v) => {
    if (!v) return "";                 // not required
    if (dayjs(v).isAfter(dayjs(), "day")) return "DOB cannot be in the future.";
    return "";
  };

  const validateGender = (v) => {
    return "";                         // not required
  };

  const setField = (name, value) => {
    setFormData((p) => ({ ...p, [name]: value }));
    setFieldErrors((p) => ({ ...p, [name]: "" }));
    setTopError(null);
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    let msg = "";
    if (name === "firstName") msg = validateFirstName(value);
    if (name === "lastName") msg = validateLastName(value);
    if (name === "email") msg = validateEmail(value);
    if (name === "phoneNumber") msg = validatePhone(value);
    if (name === "gender") msg = validateGender(value);
    setFieldErrors((p) => ({ ...p, [name]: msg }));
  };

  const handleDateChange = (date, dateString) => {
    setField("birthday", dateString);
    setFieldErrors((p) => ({ ...p, birthday: validateDOB(dateString) }));
  };

  const validateAll = () => {
    const next = {
      firstName: validateFirstName(formData.firstName),
      lastName: validateLastName(formData.lastName),
      email: validateEmail(formData.email),
      phoneNumber: validatePhone(formData.phoneNumber),
      birthday: validateDOB(formData.birthday),
      gender: validateGender(formData.gender),
    };
    setFieldErrors(next);
    return next;
  };

  /* ---------------------------------- submit -------------------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errs = validateAll();
    if (Object.values(errs).some(Boolean)) {
      setTopError("Please fill the highlighted fields.");
      return;
    }

    try {
      setTopError(null);

      let cleanPhone = formData.phoneNumber.replace(/\D/g, "");
      if(cleanPhone.startsWith("91")){
            cleanPhone = "91" + cleanPhone;
        }
      const trimFirst = formData.firstName.trim();
      const trimLast = formData.lastName.trim();

      const response = await createUser({
        ...formData,
        firstName: trimFirst,
        lastName: trimLast,
        phoneNumber: cleanPhone,
        password: "Cyntexa@123", // as per your API
      });

      if (response?.success) {
        // toast.success("Account created! Sending verification SMS…");

        setTimeout(async () => {
          try {
            const otpResponse = await sendOTP(cleanPhone);
            if (otpResponse?.success) {
              // toast.success("Verification SMS sent!");
              localStorage.setItem(
                LOCAL_KEYS.LOGIN_DATA,
                JSON.stringify({ phoneNumber: cleanPhone, type: "phone" })
              );
              navigate("/verify-otp");
            } else {
              setTopError("We couldn't send the verification SMS. Please try logging in.");
              navigate("/main-login");
            }
          } catch {
            setTopError("Account created but SMS failed. Please try logging in.");
            navigate("/main-login");
          }
        }, 800);
      }
    } catch (e) {
      setTopError(parseFriendlyError(e?.message) || "Unable to create account. Please try again.");
    }
  };

  /* ---------------------------------- render -------------------------------- */
  return (
    <Box
        h={{ base: "100dvh", md: "100vh" }}
        w="full"
        overflow="hidden"
      >
        <Flex w="100%" h="inherit">
        {/* Left image (desktop only) */}
        <Box display={{ base: "none", lg: "block" }} w={{ lg: "50%" }}>
          <ChakraImage src={authBanner} alt="authBanner" h="100%" w="100%" objectFit="cover" objectPosition="top" />
        </Box>

        {/* Right side - form */}
        <Flex position="relative" direction="column" justify="center" align="center" w="full" flex="1">
          <Box as="form" onSubmit={handleSubmit} w={{ base: "85%", lg: "75%" }}>
            <Box mx="auto" w="full">
              <Box textAlign="center">
                <ChakraImage src={logo} alt="Logo" mx="auto" maxW="full" />
              </Box>

              <Box textAlign="center" mt={3} mb={2}>
                <Text fontSize="22px" fontWeight="normal">CREATE AN ACCOUNT</Text>
              </Box>

              {topError && (
                <Alert status="error" mb={3} borderRadius="md">
                  <AlertIcon />
                  {topError}
                </Alert>
              )}

              {/* First Name */}
              <FormControl isInvalid={!!fieldErrors.firstName} mb={2}>
                <Box
                  w="full"
                  border="1px solid"
                  borderColor={fieldErrors.firstName ? "red.400" : "blackAlpha.500"}
                  px={3}
                  py={3}
                  bg="transparent"
                >
                  <Input
                    name="firstName"
                    id="firstName"
                    type="text"
                    placeholder="Enter First Name"
                    _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                    maxLength={15}
                    value={formData.firstName}
                    onChange={(e) => setField("firstName", e.target.value)}
                    onBlur={handleBlur}
                    fontSize="sm"
                    variant="unstyled"
                    isRequired
                  />
                </Box>
                <FormErrorMessage>{fieldErrors.firstName}</FormErrorMessage>
              </FormControl>

              {/* Last Name */}
              <FormControl isInvalid={!!fieldErrors.lastName} mb={2}>
                <Box
                  w="full"
                  border="1px solid"
                  borderColor={fieldErrors.lastName ? "red.400" : "blackAlpha.500"}
                  px={3}
                  py={3}
                  bg="transparent"
                >
                  <Input
                    name="lastName"
                    id="lastName"
                    type="text"
                    placeholder="Enter Last Name"
                    _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                    maxLength={15}
                    value={formData.lastName}
                    onChange={(e) => setField("lastName", e.target.value)}
                    onBlur={handleBlur}
                    fontSize="sm"
                    variant="unstyled"
                    isRequired
                  />
                </Box>
                <FormErrorMessage>{fieldErrors.lastName}</FormErrorMessage>
              </FormControl>

              {/* Email */}
              <FormControl isInvalid={!!fieldErrors.email} mb={2}>
                <Box
                  w="full"
                  border="1px solid"
                  borderColor={fieldErrors.email ? "red.400" : "blackAlpha.500"}
                  px={3}
                  py={3}
                  bg="transparent"
                >
                  <Input
                    name="email"
                    id="email"
                    type="email"
                    placeholder="Enter Email Address"
                    _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                    value={formData.email}
                    onChange={(e) => setField("email", e.target.value)}
                    onBlur={handleBlur}
                    fontSize="sm"
                    variant="unstyled"
                    isRequired
                  />
                </Box>
                <FormErrorMessage>{fieldErrors.email}</FormErrorMessage>
              </FormControl>

              {/* Phone Number */}
              <FormControl isInvalid={!!fieldErrors.phoneNumber} mb={2}>
                <Box
                  w="full"
                  border="1px solid"
                  borderColor={fieldErrors.phoneNumber ? "red.400" : "blackAlpha.500"}
                  px={3}
                  py={3}
                  bg="blackAlpha.100"
                >
                  <Flex alignItems="center">
                    <Flex alignItems="center" gap={2}>
                      <Image src={InFlag} alt="India Flag" boxSize="20px" w={5} h={4} />
                      <Text fontSize="sm" mr={4} id="countryCode">+91</Text>
                    </Flex>
                    <Input
                      name="phoneNumber"
                      id="contactNo"
                      type="tel"
                      placeholder="Phone Number"
                      _placeholder={{ color: "rgba(0,0,0,0.60)" }}
                      maxLength={10}
                      value={formData.phoneNumber}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setField("phoneNumber", digits);
                        if (!validatePhone(digits)) {
                          setFieldErrors((p) => ({ ...p, phoneNumber: "" }));
                        }
                      }}
                      onBlur={handleBlur}
                      fontSize="sm"
                      variant="unstyled"
                      isRequired
                      readOnly
                    />
                  </Flex>
                </Box>
                <FormErrorMessage>{fieldErrors.phoneNumber}</FormErrorMessage>
              </FormControl>

              {/* Date of Birth */}
              <FormControl isInvalid={!!fieldErrors.birthday} mb={2}>
                <Box
                  w="full"
                  border="1px solid"
                  borderColor={fieldErrors.birthday ? "red.400" : "blackAlpha.500"}
                  h="50px"
                  py={2}
                >
                  <DatePicker
                    className="dob-picker"
                    value={formData.birthday ? dayjs(formData.birthday) : null}
                    id="dob"
                    onChange={handleDateChange}
                    placeholder="Date of Birth"
                    format="YYYY-MM-DD"
                    name="birthday"
                    maxDate={dayjs()}
                    suffixIcon={<CalendarIcon />}
                    style={{
                      width: "100%",
                      height: "100%",
                      border: 0,
                      borderRadius: 0,
                      paddingLeft: 12,
                    }}
                    inputReadOnly
                    open={dobOpen}
                    onOpenChange={setDobOpen}
                    onClick={() => setDobOpen(true)}
                    onFocus={() => setDobOpen(true)}
                    onKeyDown={(e) => e.preventDefault()}
                    getPopupContainer={() => document.body}
                    allowClear={false}
                  />
                </Box>
                <FormErrorMessage>{fieldErrors.birthday}</FormErrorMessage>
              </FormControl>


              {/* Gender */}
              {/* <FormControl isInvalid={!!fieldErrors.gender} mt={2}>
                <GenderSelectBW
                  value={formData.gender === "" ? null : formData.gender}
                  onChange={(val) => setField("gender", val)}
                  borderColor={fieldErrors.gender ? "red.400" : "blackAlpha.500"}
                  placeholder="SELECT GENDER"
                />
                <FormErrorMessage>{fieldErrors.gender}</FormErrorMessage>
              </FormControl> */}


              {/* Submit */}
              <Flex justify="center" mt={4}>
                <Button
                  type="submit"
                  w="full"
                  bg="#1d1d1d"
                  color="white"
                  fontSize="sm"
                  borderRadius="0"
                  fontWeight="normal"
                  textTransform="uppercase"
                  py="11px"
                  isLoading={loading}
                  loadingText="Creating..."
                  _hover={{ bg: "#1d1d1d" }}
                >
                  {loading ? "Creating..." : "Create account"}
                </Button>
              </Flex>

              {/* Policy */}
              <Flex justify="center" mt={3}>
                <Text textAlign="center" fontSize="sm" color="black" maxW="xs" lineHeight="150%">
                  By proceeding, you agree to shop&apos;s{" "}
                  <Link as={RouterLink} to="/privacypolicy" borderBottom="1px solid" borderColor="black">
                    Privacy Policy
                  </Link>{" "}
                  and{" "}
                  <Link as={RouterLink} to="/terms" borderBottom="1px solid" borderColor="black">
                    Terms of Use
                  </Link>
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
            onClick={() => navigate("/")}
            aria-label="Close"
            _hover={{ bg: "#e0e0e0" }}
            icon={
              <svg width="16" height="16" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10.6671 1.33301L1.33374 10.6664M1.33374 1.33301L10.6671 10.6664" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />
        </Flex>
      </Flex>
    </Box>
  );
};

export default CreateAccount;