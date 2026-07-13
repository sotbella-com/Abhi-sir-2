import { Fragment, useEffect, useMemo, useState } from "react";
import {
  Link as RouterLink,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import Select from "react-select";
import GuestCartService from "@/api/services/guestCart";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  Box,
  Flex,
  Text,
  Button,
  Input,
  Heading,
  Stack,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useBreakpointValue,
} from "@chakra-ui/react";
import { Spin } from "antd";

import CartCouponAndPricingSection from "../Cart/cartCouponAndPricing";
import { useAuth } from "@/context/AuthContext";
import { useAddressStore } from "@/context";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import LoginFlowModal from "@/components/compounds/loginFlow";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import {
  COUNTRY_NAME,
  COUNTRY_CODE,
  DAIL_CODE,
  iso2,
} from "./../../constants/constants.js";

import {
  getFrontendPreferences,
  buildStateOptions,
  buildCityOptions,
} from "@/api/services/sfccPreferences";
import {
  createCustomerAddress,
  getCustomer,
} from "@/api/services/sfccCustomers";
import { isUserLoggedIn } from "@/utils/tokenUtils";

// (optional) your existing Select styles can stay
import {
  chakraLikeSelectStyles,
  customStyles as selectStyles,
} from "./SelectCss";
import { ShimmerCheckout } from "@/components/layouts/Simmers/ShimmerCheckout";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { useBackExitGuard } from "@/Hooks/useBackExitGuard";

const CartItems = ({ basketId }) => {
  const { getCustomerBasket } = useUnifiedCartStore();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const buyNow = searchParams.get("buy_now");

  useEffect(() => {
    const fetchBasket = async () => {
      try {
        // if (!buyNow) {
        const basketData = await getCustomerBasket(basketId);
        if (basketData?.productItems) {
          setItems(basketData.productItems);
        }
        // }
      } catch (error) {
        // console.error("Failed to fetch customer basket:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBasket();
  }, [getCustomerBasket, basketId]);

  if (loading) return <ShimmerCheckout />;

  if (!items.length) return null;

  return (
    <Box
      mt={6}
      borderWidth={{ base: "1.5px", lg: "1px" }}
      borderColor={{ base: "black", lg: "#9d9d9d" }}
      borderRadius={{ base: "lg", lg: 0 }}
      boxShadow={{
        base: "0 0 14px rgba(0, 0, 0, 0.24)",
        lg: "none",
      }}
      p={3}
    >
      <Text
        fontSize={{ base: "sm", lg: "sm" }}
        fontWeight={{ base: "normal", lg: "semibold" }}
        textTransform="uppercase"
        mb={3}
      >
        Items in your bag ({items.length})
      </Text>

      <Stack spacing={3}>
        {items.map((it, idx) => {
          const title = it?.productName || it?.itemText || "Product";
          const qty = Number(it?.quantity || 1);
          const price = Number(it?.price || it?.basePrice || 0);

          // image (basic version; CartQuickView has advanced resolveItemImage)
          const raw =
            it?.c_images?.large?.[0]?.absURL ||
            it?.c_images?.small?.[0]?.absURL ||
            it?.c_images?.large?.[0]?.url ||
            it?.c_images?.small?.[0]?.url;

          return (
            <Flex
              key={it?.itemId || `${it?.productId}-${idx}`}
              gap={3}
              align="center"
            >
              <Box
                w="70px"
                minW="70px"
                h="90px"
                overflow="hidden"
                bg="blackAlpha.50"
              >
                {raw ? (
                  <Image
                    src={raw}
                    alt={title}
                    w="full"
                    h="full"
                    objectFit="cover"
                  />
                ) : (
                  <Box w="full" h="full" bg="blackAlpha.50" />
                )}
              </Box>

              <Box flex="1" minW={0}>
                <Text
                  fontSize={{ base: "xs", lg: "sm" }}
                  noOfLines={2}
                  fontWeight="medium"
                >
                  {title}
                </Text>
                <Text
                  fontSize={{ base: "10px", lg: "xs" }}
                  opacity={0.7}
                  mt="2px"
                >
                  Qty: {qty}
                </Text>
                <Text fontSize={{ base: "xs", lg: "sm" }} mt="6px">
                  {CURRENCY_SYMBOL} {price}
                </Text>
              </Box>
            </Flex>
          );
        })}
      </Stack>
    </Box>
  );
};

const Shippingmid1 = ({ isModal = false, onClose = () => { }, isHidden = false, }) => {
  const { user, isAuthenticated, checkUserExists, createUser, sendOTP } =
    useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const urlBasketId = searchParams.get("basketId");

  const { fetchAddress, address } = useAddressStore();
  const { basket } = useUnifiedCartStore();
  const enableExitGuard = !isModal && location.pathname === "/Shipping";
  const isMobile = useBreakpointValue({ base: true, lg: false });

  const { isExitModalOpen, closeExitModal, confirmExit } = useBackExitGuard({
    enabled: enableExitGuard,
  });

  const [customerBasket, setCustomerBasket] = useState(null);
  const checkoutBasket = urlBasketId ? customerBasket : basket;

  // Fetch basket logic for Buy Now flow
  // ---------------------------
  //   Fetch basket logic(Ported from cartCouponAndPricing.jsx)
  // ---------------------------
  const fetchBasketData = async () => {
    try {
      if (urlBasketId) {
        // Case 1: Buy Now Flow - Explicitly get basket by ID using Checkout API
        try {
          // We need dynamic imports or reuse existing api client
          const endpoint = `/checkout/shopper-baskets/v2/organizations/${import.meta.env.VITE_SFCC_ORG_ID}/baskets/${urlBasketId}`;
          const { default: sfccApiClient } =
            await import("@/api/sfccApiClient");

          const url = sfccApiClient.buildUrl(
            endpoint,
            import.meta.env.VITE_SFCC_SITE_ID,
          );
          const params = new URLSearchParams({
            locale: import.meta.env.VITE_SFCC_LOCALE || "en-IN",
          });
          const fullUrl = `${url}&${params.toString()}`;

          const resolved = await sfccApiClient.get(fullUrl);

          if (resolved) {
            let finalBasket = resolved;
            // No need to fetch promotions here, just the basket structure is enough for checkout
            setCustomerBasket(finalBasket);
          }
        } catch (error) {
          // console.error("Failed to fetch temporary basket via checkout API:", error);
        }
      }
    } catch (err) {
      // console.error("Failed to resolve basket:", err);
    }
  };

  useEffect(() => {
    if (urlBasketId) {
      fetchBasketData();
    }
  }, [urlBasketId]);

  const [isAddressFetching, setIsAddressFetching] = useState(false);
  const [isLocationButtonDisabled, setIsLocationButtonDisabled] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneCode, setPhoneCode] = useState(DAIL_CODE);
  const [selectedCountryCode, setSelectedCountryCode] = useState(iso2);

  const cleanPhoneNumber = (phone = "") => {
    let value = String(phone || "").replace(/\D/g, "");

    // Example: 91919876543210 -> 919876543210
    if (value.startsWith("9191")) {
      value = value.slice(2);
    }

    // Remove country code because PhoneInput already shows 91 separately
    if (value.startsWith("91") && value.length > 10) {
      value = value.slice(2);
    }

    return value;
  };

  const getInitialPhone = (fallbackPhone = "") => {
    try {
      const loginDataStr = localStorage.getItem(LOCAL_KEYS.LOGIN_DATA);

      if (loginDataStr) {
        const loginData = JSON.parse(loginDataStr);

        if (loginData?.phoneNumber) {
          return cleanPhoneNumber(loginData.phoneNumber);
        }
      }
    } catch { }

    const storedPhone = localStorage.getItem(LOCAL_KEYS.PHONE_NUMBER);

    if (storedPhone) {
      return cleanPhoneNumber(storedPhone);
    }

    return cleanPhoneNumber(fallbackPhone);
  };

  let [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: "",
    phone: getInitialPhone(user?.phone || ""),
    address: "",
    address2: "",
    pincode: "",
    stateCode: "",
    city: "",
  });

  useEffect(() => {
    if (formData.phone && formData.phone.startsWith("9191")) {
      const updatedPhone = formData.phone.slice(2); // remove only first "91"

      setFormData((prev) => ({
        ...prev,
        phone: updatedPhone,
      }));
    }
  }, [formData.phone]);

  const [modalType, setModalType] = useState("");
  const [pendingAction, setPendingAction] = useState(null);

  // 🔽 Preferences-driven selects
  const [prefs, setPrefs] = useState(null);
  const [stateOpts, setStateOpts] = useState([]);
  const [cityOpts, setCityOpts] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [apiStatusMessage, setApiStatusMessage] = useState("");

  // =============== Helpers ===============
  const onInputChange = (e) => {
    const { name, value } = e.target;
    // Strict 9 digit limit
    // Limit to 10 digits as requested
    if (name === "phone" && value.length > 10) {
      return;
    }
    setFormData((p) => ({ ...p, [name]: value }));
    if (value) setFieldErrors((p) => ({ ...p, [name]: false }));
  };

  const onSelectState = (opt) => {
    const codeOrName = opt?.value || "";
    setFormData((p) => ({ ...p, stateCode: codeOrName, city: "" }));
    setCityOpts(buildCityOptions(prefs, codeOrName));
    setFieldErrors((p) => ({ ...p, stateCode: false }));
  };

  const onSelectCity = (opt) => {
    setFormData((p) => ({ ...p, city: opt?.value || "" }));
    setFieldErrors((p) => ({ ...p, city: false }));
  };

  const getCompletePhoneNumber = () => {
    const raw = formData.phone || "";
    if (!raw) return "";
    const cc = phoneCode.startsWith("+") ? phoneCode : `+${phoneCode}`;
    return `${cc}${raw}`;
  };

  const getCurrentLocationAndAddress = () => {
    if (!navigator.geolocation) {
      // toast.error("Geolocation is not supported by your browser");
      return;
    }

    // Disable button for 5 seconds
    setIsLocationButtonDisabled(true);
    setTimeout(() => setIsLocationButtonDisabled(false), 5000);

    setIsAddressFetching(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
          if (!apiKey) {
            // console.warn("VITE_GOOGLE_MAPS_API_KEY is missing");
          }

          const res = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`,
          );
          const data = await res.json();
          console.log(data, "Google Maps Geocoding API response");

          if (data.status === "OK" && data.results?.[0]) {
            const result = data.results[0];
            const fullAddress = result.formatted_address;
            const parts = fullAddress.split(",").map((p) => p.trim());

            const comps = result.address_components;
            const getComp = (type) =>
              comps.find((c) => c.types.includes(type))?.long_name || "";

            let street = getComp("route");
            const streetNum = getComp("street_number");
            if (streetNum) street = `${streetNum}, ${street}`;
            if (!street) street = result.formatted_address; // Fallback

            const postcode = getComp("postal_code");
            const stateName = getComp("administrative_area_level_1");
            const cityName =
              getComp("locality") || getComp("administrative_area_level_2");

            let newStateCode = "";
            let newCity = "";

            // Auto-select State
            if (stateName && stateOpts.length > 0) {
              const matchedState = stateOpts.find(
                (s) =>
                  String(s.label).toLowerCase() === stateName.toLowerCase() ||
                  String(s.value).toLowerCase() === stateName.toLowerCase(),
              );
              if (matchedState) {
                newStateCode = matchedState.value;

                // Build city options for this state immediately to find city match
                if (prefs) {
                  const cities = buildCityOptions(prefs, newStateCode);
                  setCityOpts(cities);

                  // Auto-select City
                  const matchedCity = cities.find(
                    (c) =>
                      String(c.label).toLowerCase() ===
                      cityName.toLowerCase() ||
                      String(c.value).toLowerCase() === cityName.toLowerCase(),
                  );
                  if (matchedCity) {
                    newCity = matchedCity.value;
                  } else {
                    newCity = cityName;
                  }
                }
              }
            }
            const addressLine1 = parts.slice(0, 2).join(", "); // B- 89, Block C
            const addressLine2 = parts.slice(2, parts.length - 3).join(", "); // Sector 88
            setFormData((prev) => ({
              ...prev,
              // address: street || prev.address,
              address: addressLine1 || prev.address,
              address2: addressLine2 || prev.address2,
              pincode: postcode || prev.pincode,
              stateCode: newStateCode || prev.stateCode,
              city: newCity || prev.city,
            }));

            // toast.success("Location retrieved successfully");
          } else {
            throw new Error("Address not found via Google Maps");
          }
        } catch (error) {
          // console.error("Location Fetch Error:", error);
          // toast.error("Failed to fetch address details. Please check API key or configuration.");
        } finally {
          setIsAddressFetching(false);
        }
      },
      (error) => {
        setIsAddressFetching(false);
        let msg = "Unable to retrieve your location.";
        if (error.code === error.PERMISSION_DENIED) {
          msg =
            "Location access is required. Please enable it from your device settings.";
        }
        toast.success(msg);
      },
    );
  };

  const validate = () => {
    const errors = {};
    let isValid = true;

    if (!formData.firstName?.trim()) {
      errors.firstName = true;
      isValid = false;
    } else if (formData.firstName.length > 50) {
      errors.firstName = true;
      isValid = false;
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = true;
      isValid = false;
    } else if (formData.lastName.length > 50) {
      errors.lastName = true;
      isValid = false;
    }

    if (!formData.email?.trim()) {
      errors.email = true;
      isValid = false;
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = true;
      isValid = false;
    }

    if (!formData.phone?.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else {
      const phone = formData.phone.trim();
      const pLen = phone.length;

      if (phone.startsWith("0")) {
        errors.phone = "Phone number cannot start with 0";
        isValid = false;
      } else if (pLen < 10 || pLen > 10) {
        errors.phone = "Please enter a valid phone number";
        isValid = false;
      }
    }

    if (!formData.address?.trim()) {
      errors.address = true;
      isValid = false;
    }
    if (!formData.pincode?.trim()) {
      errors.pincode = true;
      isValid = false;
    }
    if (!formData.stateCode) {
      errors.stateCode = true;
      isValid = false;
    }
    if (!formData.city) {
      errors.city = true;
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  // =============== Effects ===============
  useEffect(() => {
    // Load frontend preferences for state/city mapping
    (async () => {
      try {
        const data = await getFrontendPreferences();
        setPrefs(data);
        setStateOpts(buildStateOptions(data));
      } catch (err) {
        // toast.error("Failed to load preferences");
      }
    })();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pendingAction === "SAVE_ADDRESS") {
      setPendingAction(null);
      saveAddressToSFCC();
    }
  }, [isAuthenticated, pendingAction]);

  const selectedState = useMemo(() => {
    if (!formData.stateCode) return null;
    return (
      stateOpts.find(
        (s) =>
          String(s.value).toLowerCase() ===
          String(formData.stateCode).toLowerCase() ||
          String(s.label).toLowerCase() ===
          String(formData.stateCode).toLowerCase(),
      ) || null
    );
  }, [stateOpts, formData.stateCode]);

  const selectedCity = useMemo(() => {
    if (!formData.city) return null;

    return (
      cityOpts.find(
        (c) =>
          String(c.value).toLowerCase() === String(formData.city).toLowerCase() ||
          String(c.label).toLowerCase() === String(formData.city).toLowerCase()
      ) || {
        label: formData.city,
        value: formData.city,
      }
    );
  }, [cityOpts, formData.city]);

  // =============== SFCC Submit ===============
  const saveAddressToSFCC = async () => {
    setApiStatusMessage("");
    // Only user tokens can create addresses
    // if (!isUserLoggedIn()) {
    //   // toast.error("You must be logged in to add an address");
    //   navigate("/login");
    //   return;
    // }

    if (!validate()) {
      // toast.error("Please fill the highlighted fields");
      return;
    }

    // if(formData?.phone?.startsWith())
    const payload = {
      addressId: `addr_${Date.now()}`,
      address1: formData.address,
      address2: formData.address2, // 👈 now used
      city: formData.city,
      countryCode: COUNTRY_CODE,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: getCompletePhoneNumber(),
      postalCode: formData.pincode,
      stateCode: formData.stateCode,
      c_isDefault: formData.setAsDefault || false,
      c_email: formData.email,
    };

    try {
      setIsSubmitting(true);

      if (!isAuthenticated) {
        // Use phone number for check instead of email
        let cleanPhone = formData.phone?.replace(/\D/g, "") || "";
        // const trimmed = payload.c_email.trim();

        if (!cleanPhone || cleanPhone.length < 10) {
          toast.error("Please enter a valid phone number");
          setIsSubmitting(false);
          return;
        }
        if (cleanPhone.startsWith("91")) {
          cleanPhone = "91" + cleanPhone;
        }
        const result = await checkUserExists(cleanPhone);

        if (result.success && result.userExists) {
          // toast.success("OTP sent to your phone");

          localStorage.setItem(
            LOCAL_KEYS.LOGIN_DATA,
            JSON.stringify({ phoneNumber: cleanPhone, type: "phone" }),
          );

          setModalType("OTP");
          // navigate("/verify-otp"); // If you want to redirect, but staying on modal is likely better here
          return;
        } else {
          // Auto-signup for new user
          const signUpPayload = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phoneNumber: cleanPhone, // Use clean phone
            email: payload.c_email.trim(),
            password: "Cyntexa@123", // Default password for guest conversion
          };

          const createRes = await createUser(signUpPayload);

          if (createRes?.success) {
            // Send OTP to phone
            const otpRes = await sendOTP(cleanPhone);
            if (otpRes?.success) {
              localStorage.setItem(
                LOCAL_KEYS.LOGIN_DATA,
                JSON.stringify({ phoneNumber: cleanPhone, type: "phone" }),
              );
              setModalType("OTP");
            } else {
              // Fallback if OTP fails
              toast.error(
                "Account created but verification failed. Please try logging in.",
              );
              setModalType("LOGIN");
            }
          } else {
            const msg = getUserFriendlyErrorMessage(createRes?.error);
            setApiStatusMessage(msg);
          }
          return;
        }
      }

      // Optional read to assert token scope
      await getCustomer();

      const queryParams = new URLSearchParams(location.search);
      const isBuyNow = queryParams.get("buy_now");
      let targetBasketId;
      if (isBuyNow) {
        const buyNowDataRaw = sessionStorage.getItem("buy_now_data");
        if (buyNowDataRaw) {
          try {
            const { productId, quantity } = JSON.parse(buyNowDataRaw);
            if (productId) {
              // Ensure we have a basket ID to add to
              // For authenticated user, basket should have been merged/loaded by now
              // targetBasketId = basket?.basketId;

              // if (!targetBasketId) {
              // Fallback: try to create or get basket
              const newBasket = await GuestCartService.createBasket({
                temporary: true,
              });
              targetBasketId = newBasket.basketId;
              // }

              // if (targetBasketId) {
              await GuestCartService.addToBasket(
                productId,
                quantity,
                targetBasketId,
              );
              // Clear the buy_now_data so it doesn't run again if they come back
              sessionStorage.removeItem("buy_now_data");
              // }
            }
          } catch (e) {
            // console.error("Failed to process buy now data", e);
          }
        }
      }

      await createCustomerAddress({ address: payload });

      // refresh local store if you keep a copy there
      await fetchAddress({ customerId: undefined });

      if (isModal) {
        onClose(); // ✅ close modal
        return;
      }

      navigate({ pathname: "/address", search: location.search });

      // toast.success("Address added");
      if (targetBasketId) {
        navigate(`/address?basketId=${targetBasketId}`); // or the next step in your checkout flow
      } else {
        navigate({ pathname: "/address", search: location.search }); // or the next step in your checkout flow
      }
    } catch (err) {
      const apiError = err?.response?.data || {};
      const msg = getUserFriendlyErrorMessage(apiError);
      setApiStatusMessage(msg);

      if (apiError?.statusCode === "email_exists") {
        setModalType("LOGIN");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUserFriendlyErrorMessage = (errorPayload) => {
    if (!errorPayload) {
      return "Something went wrong. Please try again.";
    }

    let parsed = errorPayload;

    if (typeof errorPayload === "string") {
      try {
        const jsonStart = errorPayload.indexOf("{");
        if (jsonStart !== -1) {
          parsed = JSON.parse(errorPayload.slice(jsonStart));
        } else {
          parsed = { message: errorPayload };
        }
      } catch {
        parsed = { message: errorPayload };
      }
    }

    const statusCode = parsed?.statusCode || "";
    const statusMessage = parsed?.statusMessage || "";
    const detail = parsed?.detail || "";
    const message = parsed?.message || "";

    if (statusCode === "email_exists") {
      return "An account with this email already exists.";
    }

    return (
      statusMessage ||
      message ||
      detail ||
      "Something went wrong. Please try again."
    );
  };

  const handleCancelPurchase = () => {
    confirmExit();
  };

  const greetingName = user?.firstName || "Guest";

  const getFieldBorderProps = (hasError) => {
    const borderColor = hasError ? "red.500" : "black";

    return {
      borderStyle: "solid",

      // mobile: only bottom border
      // desktop/tablet: full border
      borderWidth: {
        base: "0 0 1px 0",
        md: "1px",
      },

      borderColor,
      boxShadow: "none",

      _hover: {
        borderStyle: "solid",
        borderWidth: {
          base: "0 0 1px 0",
          md: "1px",
        },
        borderColor,
        boxShadow: {
          base: "none",
          md: hasError ? "inset 0 0 0 1px var(--chakra-colors-red-500)" : "none",
        },
      },

      _focus: {
        outline: "none",
        borderStyle: "solid",
        borderWidth: {
          base: "0 0 1px 0",
          md: "1px",
        },
        borderColor,
        boxShadow: {
          base: "none",
          md: hasError ? "inset 0 0 0 1px var(--chakra-colors-red-500)" : "none",
        },
      },

      _focusVisible: {
        outline: "none",
        borderStyle: "solid",
        borderWidth: {
          base: "0 0 1px 0",
          md: "1px",
        },
        borderColor,
        boxShadow: {
          base: "none",
          md: hasError ? "inset 0 0 0 1px var(--chakra-colors-red-500)" : "none",
        },
      },
    };
  };

  // =============== UI ===============
  return (
    <Fragment>
      <Box
        w="full"
        textAlign="left"
        px={{ base: "12px", lg: "50px" }}
        pt={{ base: isModal ? "20px" : "0", lg: isModal ? "30px" : "0" }}
        pb={4}
      >
        <Flex
          gap={{ base: 4, lg: 10 }}
          flexDirection={{ base: "column", lg: "row" }}
        >
          {/* Left column */}
          <Box w={{ base: "100%", lg: isModal ? "100%" : "50%" }}>
            <Box w="full" mt={{ base: 6, lg: 0 }}>
              {/* <Heading
                as="h4"
                fontWeight="normal"
                fontSize={{ base: "xl", lg: "2xl" }}
                mb={2}
              >
                Hi, {greetingName}
              </Heading> */}

              <Flex mb={2} justify="space-between" align="center">
                <Text
                  textTransform="uppercase"
                  fontWeight="normal"
                  fontSize={{ base: "sm", lg: "lg" }}
                >
                  Add Shipping Address
                </Text>
                <Button
                  id="use-current-location"
                  type="button"
                  variant="outline"
                  borderColor="black"
                  color="black"
                  size="sm"
                  px={4}
                  py={2}
                  mb={{ lg: 3 }}
                  rounded="md"
                  _hover={{ bg: "none" }}
                  onClick={getCurrentLocationAndAddress}
                  isDisabled={isAddressFetching || isLocationButtonDisabled}
                  leftIcon={
                    isAddressFetching ? (
                      <Box as="span">
                        <Spin size="small" style={{ marginRight: "5px" }} />
                      </Box>
                    ) : (
                      <Box as="span" className="fa fa-map-marker-alt" />
                    )
                  }
                >
                  Use My Current Location
                </Button>
              </Flex>

              {/* Form */}
              <Box as="form" w="full">
                <Flex wrap="wrap" mx={-1}>
                  {/* First Name */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Input
                      type="text"
                      placeholder="First Name"
                      name="firstName"
                      maxLength={50}
                      value={formData.firstName}
                      onChange={onInputChange}
                      color="black"
                      px={3}
                      py={2}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.firstName)}
                    />
                  </Box>

                  {/* Last Name */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Input
                      type="text"
                      placeholder="Last name"
                      name="lastName"
                      maxLength={50}
                      value={formData.lastName}
                      onChange={onInputChange}
                      color="black"
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.lastName)}
                    />
                  </Box>

                  {/* Address */}
                  <Box w="100%" px={1} mb={2}>
                    <Input
                      type="text"
                      placeholder="Address Line 1 (House No, Building, Street)"
                      name="address"
                      value={formData.address}
                      onChange={onInputChange}
                      maxLength={100}
                      color="black"
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.address)}
                    />
                  </Box>
                  <Box w="100%" px={1} mb={2}>
                    <Input
                      type="text"
                      placeholder="Address Line 2 (Apartment, Street, Area)"
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      name="address2"
                      value={formData.address2}
                      onChange={onInputChange}
                      maxLength={100}
                      color="black"
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      {...getFieldBorderProps(!!fieldErrors.address2)}
                    />
                  </Box>

                  {/* Country */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Input
                      value={COUNTRY_NAME}
                      isDisabled
                      color={"black"}
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.countryCode)}
                      _disabled={{
                        opacity: 1,
                        bg: "transparent",
                        cursor: "not-allowed",
                        color: "blackAlpha.700",
                      }}
                    />
                  </Box>

                  {/* State (from Preferences) */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Select
                      options={stateOpts}
                      value={selectedState}
                      styles={chakraLikeSelectStyles(!!fieldErrors.stateCode)}
                      placeholder="State"
                      onChange={onSelectState}
                      isSearchable
                    />
                  </Box>

                  {/* City (dynamic from selected state) */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Select
                      options={cityOpts}
                      value={selectedCity}
                      styles={chakraLikeSelectStyles(!!fieldErrors.city)}
                      placeholder="City"
                      onChange={onSelectCity}
                      isSearchable
                      isDisabled={!formData.stateCode}
                    />
                  </Box>

                  {/* Pincode */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Input
                      type="text"
                      placeholder="Pincode / ZIP"
                      maxLength={6}
                      name="pincode"
                      value={formData.pincode}
                      onChange={onInputChange}
                      color="black"
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.pincode)}
                    />
                  </Box>

                  {/* Email */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Input
                      type="email"
                      placeholder="Enter email"
                      name="email"
                      value={formData.email}
                      onChange={onInputChange}
                      color="black"
                      px={3}
                      py={{ base: 3, md: 2 }}
                      fontSize="sm"
                      borderRadius={0}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      {...getFieldBorderProps(!!fieldErrors.email)}
                    />
                    {apiStatusMessage && (
                      <Box mb={3} px={1}>
                        <Text fontSize="xs" color="red.500" fontWeight="medium">
                          {apiStatusMessage}
                        </Text>
                      </Box>
                    )}
                  </Box>

                  {/* Phone with country selector */}
                  <Box w={{ base: "100%", sm: "50%" }} px={1} mb={2}>
                    <Flex
                      color="blackAlpha.700"
                      position="relative"
                      overflow="hidden"
                      borderStyle="solid"
                      borderWidth={{
                        base: "0 0 1px 0",
                        md: "1px",
                      }}
                      borderColor={fieldErrors.phone ? "red.500" : "black"}
                      boxShadow="none"
                      _hover={{
                        borderColor: fieldErrors.phone ? "red.500" : "black",
                        boxShadow: "none",
                      }}
                    >
                      <Box w="80px" flexShrink={0}>
                        <PhoneInput
                          country={selectedCountryCode}
                          value={phoneCode}
                          onChange={(v, c) => {
                            const next = v.startsWith("+") ? v : `+${v}`;
                            setPhoneCode(next);
                            if (c?.countryCode)
                              setSelectedCountryCode(c.countryCode);
                          }}
                          enableSearch
                          disableDropdown={false}
                          inputStyle={{
                            width: "100%",
                            height: "40px",
                            borderRadius: 0,
                            border: 0,

                            // ✅ mobile: transparent (underline style), desktop: light gray
                            backgroundColor:
                              typeof window !== "undefined" &&
                                window.innerWidth < 768
                                ? "transparent"
                                : "#f5f5f5",
                          }}
                          buttonStyle={{
                            borderRadius: 0,
                            border: 0,
                            backgroundColor: "transparent",
                          }}
                          countryCodeEditable={false}
                          autoFormat
                          inputProps={{ readOnly: true }}
                          disableCountryCode={true}
                        />
                      </Box>
                      <Box w="full">
                        <Input
                          type="number"
                          placeholder="Mobile no."
                          name="phone"
                          value={formData.phone}
                          onChange={onInputChange}
                          fontSize="sm"
                          border="0"
                          borderRadius={0}
                          color="black"
                          _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                          _focus={{
                            boxShadow: "none",
                            outline: "none",
                          }}
                          _focusVisible={{
                            boxShadow: "none",
                            outline: "none",
                          }}
                          _hover={{
                            boxShadow: "none",
                          }}
                        />
                      </Box>
                    </Flex>
                    {fieldErrors.phone && (
                      <Text
                        color="red.500"
                        fontSize="10px"
                        ml={1}
                      >
                        {fieldErrors.phone}
                      </Text>
                    )}
                  </Box>
                </Flex>

                {/* Actions */}
                <Flex gap={2} mt={4}>
                  <Button
                    type="button"
                    onClick={() => {
                      if (isModal) onClose();
                      else
                        navigate({
                          pathname: "/address",
                          search: location.search,
                        });
                    }}
                    textTransform="uppercase"
                    fontSize="sm"
                    color="white"
                    bg="black"
                    px={4}
                    py={2.5}
                    w="100px"
                    _hover={{ bg: "gray.800" }}
                    borderRadius={0}
                  >
                    Back
                  </Button>

                  <Button
                    id="save-current-address"
                    onClick={saveAddressToSFCC}
                    isDisabled={isSubmitting}
                    textTransform="uppercase"
                    fontSize="sm"
                    color="white"
                    bg="black"
                    px={4}
                    py={2.5}
                    flex="1"
                    _hover={{ bg: "gray.800" }}
                    borderRadius={0}
                  >
                    {isSubmitting ? "Saving..." : "Save & View Shipping"}
                  </Button>
                </Flex>

                <Text
                  mt={3}
                  textAlign="center"
                  fontSize="xs"
                  lineHeight="normal"
                >
                  By submitting, you agree to our{" "}
                  <Box
                    as={RouterLink}
                    to="/terms"
                    fontWeight="bold"
                    display="inline"
                    textDecoration={"underline"}
                  >
                    Terms
                  </Box>{" "}
                  &{" "}
                  <Box
                    as={RouterLink}
                    to="/privacypolicy"
                    fontWeight="bold"
                    display="inline"
                    textDecoration={"underline"}
                  >
                    Privacy Policy
                  </Box>
                  .
                </Text>
              </Box>
            </Box>
            {!isModal && (
              <Box>
                <CartItems basketId={urlBasketId} />
              </Box>
            )}
          </Box>

          {/* Right column (hide inside modal) */}
          {!isModal && (
            <Box w={{ base: "full", lg: "50%" }}>
              <CartCouponAndPricingSection
                seeMoreClick={() => { }}
                setHandleSeeMore={() => { }}
                bottomRef={{ current: null }}
                buttonTitle="Pay Now"
                onButtonClick={() => { }}
                isButtonDisable={true}
                selectedItems={checkoutBasket?.productItems || []}
                guestCartData={checkoutBasket}
              />
            </Box>
          )}
        </Flex>
      </Box>
      <LoginFlowModal
        modalType={modalType}
        setModalType={setModalType}
        onCompletion={() => {
          setModalType("");
          setPendingAction("SAVE_ADDRESS");
        }}
      />

      {isExitModalOpen && (
        <Modal
          isOpen={true}
          onClose={closeExitModal}
          motionPreset={isMobile ? "slideInBottom" : "scale"}
          isCentered={!isMobile} // ✅ centered only on desktop
        >
          <ModalOverlay bg="blackAlpha.600" backdropFilter="blur(10px)" />

          <ModalContent
            // ✅ Bottom sheet on mobile
            position={isMobile ? "fixed" : "relative"}
            bottom={isMobile ? "0" : "auto"}
            left={isMobile ? "0" : "auto"}
            right={isMobile ? "0" : "auto"}
            w={{ base: "100%", md: "500px", lg: "600px" }}
            maxW="100%"
            m={isMobile ? "0" : "auto"}
            borderRadius={isMobile ? "20px 20px 0 0" : "xl"} // ✅ rounded top only on mobile
            overflow="hidden"
            py={isMobile ? "8" : "4"}
          >
            <ModalBody textAlign="center" py={2}>
              <Text fontSize="2xl" fontWeight="bold">
                {user?.firstName || user?.lastName
                  ? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim()
                  : "Guest"}
              </Text>

              <Text
                fontSize="md"
                color="blackAlpha.700"
                mb={6}
                letterSpacing={1}
              >
                Your cart items are selling fast!
              </Text>

              <Box
                bg="#FFF5E8"
                borderRadius="xl"
                p={5}
                mb={6}
                border="1px solid"
                borderColor="orange.100"
              >
                <Box
                  w="70px"
                  h="70px"
                  borderRadius="full"
                  bg="white"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  mx="auto"
                  mb={3}
                  borderLeft="2px solid"
                  borderRight="6px solid"
                  borderTop="4px solid"
                  borderBottom="4px solid"
                  borderColor="orange.100"
                >
                  <Text fontSize="40px" lineHeight="1">
                    📦
                  </Text>
                </Box>

                <Text fontSize="xl" fontWeight="900" mb={1}>
                  Few items left
                </Text>
                <Text fontSize="sm" color="blackAlpha.700">
                  Hurry now and continue shopping
                </Text>
              </Box>

              <Button
                w="full"
                bg="blackAlpha.900"
                color="white"
                borderRadius="md"
                fontSize={"sm"}
                py={6}
                _hover={{ bg: "blackAlpha.800" }}
                onClick={closeExitModal}
                fontWeight="bold"
                mb={3}
              >
                STAY ON PAGE
              </Button>

              <Button
                variant="link"
                color="black"
                textDecoration="underline"
                textUnderlineOffset={4}
                onClick={handleCancelPurchase}
                fontSize={"sm"}
                fontWeight="bold"
              >
                Cancel purchase
              </Button>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Fragment>
  );
};

export default Shippingmid1;
