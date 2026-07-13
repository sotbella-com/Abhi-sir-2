import { Fragment, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import Select from "react-select";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import {
  Box, Flex, Heading, Text, Image, Button, Input, Link,
} from "@chakra-ui/react";
import leftArrow from "@/assets/images/left-arrow.png";
import InsideNavbar from "@/components/layouts/InsideNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import { ProfileSideBar } from "@/components/layouts";
import { useMobile } from "@/components/molecules";
import { useAddressStore, useAuth } from "@/context";

// Preferences (state/city)
import { getFrontendPreferences, buildStateOptions, buildCityOptions } from "@/api/services/sfccPreferences";
// SFCC customer API
import { createCustomerAddress, getCustomer } from "@/api/services/sfccCustomers";
// Token helpers
import { isUserLoggedIn } from "@/utils/tokenUtils";
import { Spin } from "antd";
import { chakraLikeSelectStyles, customStyles as selectStyles } from "../../pages/Shipping/SelectCss.jsx";
// import { getSiteConfig } from "@/utils/sfccSiteConfig";
import { color } from "framer-motion";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { COUNTRY_CODE, COUNTRY_NAME, DAIL_CODE, iso2 } from "@/constants/constants";

const baseInputProps = {
  px: 3,
  py: { base: 3, md: 4 }, // mobile slightly tighter, desktop same feel
  fontSize: "sm",
  color: "black",
  borderRadius: 0,

  // ✅ mobile: underline only, desktop: full border
  border: { base: "none", md: "1px solid" },
  borderBottom: { base: "1px solid", md: "1px solid" },
  borderColor: "black",

  _placeholder: { color: "rgba(0,0,0,0.30)" },

  _focus: {
    boxShadow: "none",
    outline: "none",
    border: { base: "none", md: "1px solid" },
    borderBottom: "1px solid",
    borderColor: "black",
  },
  _focusVisible: {
    boxShadow: "none",
    outline: "none",
    border: { base: "none", md: "1px solid" },
    borderBottom: "1px solid",
    borderColor: "black",
  },
  _hover: {
    border: { base: "none", md: "1px solid" },
    borderBottom: "1px solid",
    borderColor: "black",
    boxShadow: "none",
  },
};

const getInputErrorProps = (hasError) => ({
  border: {
    base: "none",
    md: "1px solid",
  },
  borderBottom: "1px solid",

  borderColor: {
    base: hasError ? "red.500" : "black",
    md: hasError ? "red.500" : "black",
  },
  borderTopColor: {
    base: "transparent",
    md: hasError ? "red.500" : "black",
  },
  borderRightColor: {
    base: "transparent",
    md: hasError ? "red.500" : "black",
  },
  borderLeftColor: {
    base: "transparent",
    md: hasError ? "red.500" : "black",
  },
  borderBottomColor: hasError ? "red.500" : "black",

  _hover: {
    border: {
      base: "none",
      md: "1px solid",
    },
    borderBottom: "1px solid",
    borderColor: {
      base: hasError ? "red.500" : "black",
      md: hasError ? "red.500" : "black",
    },
    borderTopColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderRightColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderLeftColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderBottomColor: hasError ? "red.500" : "black",
    boxShadow: "none",
  },

  _focus: {
    boxShadow: "none",
    outline: "none",
    border: {
      base: "none",
      md: "1px solid",
    },
    borderBottom: "1px solid",
    borderColor: {
      base: hasError ? "red.500" : "black",
      md: hasError ? "red.500" : "black",
    },
    borderTopColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderRightColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderLeftColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderBottomColor: hasError ? "red.500" : "black",
  },

  _focusVisible: {
    boxShadow: "none",
    outline: "none",
    border: {
      base: "none",
      md: "1px solid",
    },
    borderBottom: "1px solid",
    borderColor: {
      base: hasError ? "red.500" : "black",
      md: hasError ? "red.500" : "black",
    },
    borderTopColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderRightColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderLeftColor: {
      base: "transparent",
      md: hasError ? "red.500" : "black",
    },
    borderBottomColor: hasError ? "red.500" : "black",
  },
});

const Addaddress = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const { fetchAddress } = useAddressStore();
  const stripCountryCode = (phone = "") =>
    phone.replace(/^\+?\d{1,2}/, "");


  const [formData, setFormData] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: "",
    phone: stripCountryCode(user?.phone || ""),
    address: "",
    address2: "",
    pincode: "",
    stateCode: "",
    city: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [prefs, setPrefs] = useState(null);
  const [stateOpts, setStateOpts] = useState([]);
  const [cityOpts, setCityOpts] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phoneCode, setPhoneCode] = useState(DAIL_CODE || "+91");
  const [selectedCountryCode, setSelectedCountryCode] = useState(iso2 || "in");
  const [isAddressFetching, setIsAddressFetching] = useState(false);
  const [isLocationButtonDisabled, setIsLocationButtonDisabled] = useState(false);

  const onInputChange = (e) => {
    const { name, value } = e.target;
    // Strict 10 digit limit for phone
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

  const getCompletePhone = () => {
    const raw = formData.phone || "";
    if (!raw) return "";
    const cc = phoneCode.startsWith("+") ? phoneCode : `+${phoneCode}`;
    return `${cc}${raw}`;
  };

  // Load preferences once
  useEffect(() => {
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

  const selectedState = useMemo(() => {
    if (!formData.stateCode) return null;
    return stateOpts.find(
      s =>
        String(s.value).toLowerCase() === String(formData.stateCode).toLowerCase() ||
        String(s.label).toLowerCase() === String(formData.stateCode).toLowerCase()
    ) || null;
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

          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
          const data = await res.json();

          if (data.status === "OK" && data.results?.[0]) {
            const result = data.results[0];
            const comps = result.address_components;
            const getComp = (type) => comps.find((c) => c.types.includes(type))?.long_name || "";

            let address1 = "";
            let address2 = "";

            // Build Address Line 1 (House No + Street)
            const street = getComp("route");
            const streetNum = getComp("street_number");

            if (streetNum || street) {
              address1 = [streetNum, street].filter(Boolean).join(", ");
            }

            // Build Address Line 2 (Area, sublocality, etc.)
            const sublocality =
              getComp("sublocality") ||
              getComp("sublocality_level_1") ||
              getComp("neighborhood");

            if (sublocality) {
              address2 = sublocality;
            }

            // Fallback
            if (!address1) {
              address1 = result.formatted_address;
            }

            const postcode = getComp("postal_code");
            const stateName = getComp("administrative_area_level_1");
            const cityName = getComp("locality") || getComp("administrative_area_level_2");

            let newStateCode = "";
            let newCity = "";

            // Auto-select State
            if (stateName && stateOpts.length > 0) {
              const matchedState = stateOpts.find(
                (s) =>
                  String(s.label).toLowerCase() === stateName.toLowerCase() ||
                  String(s.value).toLowerCase() === stateName.toLowerCase()
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
                      String(c.label).toLowerCase() === cityName.toLowerCase() ||
                      String(c.value).toLowerCase() === cityName.toLowerCase()
                  );
                  if (matchedCity) {
                    newCity = matchedCity.value;
                  } else {
                    newCity = cityName;
                  }
                }
              }
            }

            setFormData((prev) => ({
              ...prev,
              address: address1 || prev.address,
              address2: address2 || prev.address2,
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
          msg = "Location access is required. Please enable it from your device settings.";
        }
        toast.success(msg);
      }
    );
  };

  const validate = () => {
    const errors = {};
    let isValid = true;

    if (!formData.firstName?.trim()) { errors.firstName = true; isValid = false; }
    else if (formData.firstName.length > 50) { errors.firstName = true; isValid = false; }

    if (!formData.lastName?.trim()) { errors.lastName = true; isValid = false; }
    else if (formData.lastName.length > 50) { errors.lastName = true; isValid = false; }

    if (!formData.email?.trim()) { errors.email = true; isValid = false; }
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) { errors.email = true; isValid = false; }

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

    if (!formData.address?.trim()) { errors.address = true; isValid = false; }
    if (!formData.pincode?.trim()) { errors.pincode = true; isValid = false; }
    if (!formData.stateCode) { errors.stateCode = true; isValid = false; }
    if (!formData.city) { errors.city = true; isValid = false; }

    setFieldErrors(errors);
    return isValid;
  };

  const onSave = async () => {
    // 🔐 hard-stop if not logged in
    if (!isUserLoggedIn()) {
      // toast.error("You must be logged in to add an address");
      navigate("/login"); // or your OTP entry route
      return;
    }

    if (!validate()) {
      // toast.error("Please fill the highlighted fields");
      return;
    }

    const payload = {
      addressId: `addr_${Date.now()}`,
      address1: formData.address,
      address2: formData.address2,
      city: formData.city,
      countryCode: COUNTRY_CODE,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: getCompletePhone(),
      postalCode: formData.pincode,
      stateCode: formData.stateCode,
      c_isDefault: formData.setAsDefault || false,
      c_email: formData.email,
    };

    try {
      setIsSubmitting(true);

      // Optional: touch the customer record (verifies token scope)
      await getCustomer();

      await createCustomerAddress({ address: payload });

      await fetchAddress({ customerId: undefined /* store can read from token if you prefer */ });
      // toast.success("Address added");
      navigate("/customer-address");
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Failed to create address";
      // toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => navigate(-1);

  // ----------------------------
  // UI
  // ----------------------------
  return (
    <Fragment>
      {/* <InsideNavbar /> */}
      <LogoNavbar />

      <CartQuickView />

      {/* Desktop heading */}
      <Box mt="90px" display={{ base: "none", md: "block" }}>
        <Box textAlign="center">
          <Heading
            as="h1"
            fontFamily="Dm Serif Display"
            fontWeight="normal"
            fontSize="4xl"
            textTransform="uppercase"
          >
            My Account / Address
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 14, md: 7 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab="ADDRESS" />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Desktop top row */}
            <Box display={{ base: "none", md: "block" }}>
              <Flex justify="space-between" align="center">
                <Text fontWeight="semibold">ADD NEW ADDRESS</Text>
                <Button
                  onClick={getCurrentLocationAndAddress}
                  isDisabled={isAddressFetching || isLocationButtonDisabled}
                  variant="outline"
                  borderColor="black"
                  color="black"
                  fontSize="sm"
                  px={4}
                  py={2}
                  rounded="md"
                  _hover={{ bg: "none" }}
                  mt={isMobile ? 4 : 0}
                  display="inline-flex"
                  alignItems="center"
                  gap={2}
                >
                  {isAddressFetching ? (
                    <Spin size="small" style={{ marginRight: "5px" }} />
                  ) : (
                    <Box as="i" className="fa fa-map-marker-alt" mr={2} />
                  )}
                  Use My Current Location
                </Button>
              </Flex>
            </Box>

            {/* Mobile bar */}
            <Flex
              align="center"
              justify="space-between"
              mb={{ base: 2, md: 4 }}
              display={{ base: "flex", md: "none" }}
            >
              <Link
                as={RouterLink}
                to="/customer-address"
                textTransform="uppercase"
                fontWeight="medium"
                display="flex"
                alignItems="center"
                fontSize={{ base: "sm", md: "md" }}
              >
                <Image src={leftArrow} alt="Back" w="16px" mr={2} />
                ADD ADDRESS
              </Link>
              <Button
                onClick={getCurrentLocationAndAddress}
                isDisabled={isAddressFetching || isLocationButtonDisabled}
                variant="outline"
                borderColor="black"
                color="black"
                fontSize="xs"
                px={4}
                py={2}
                rounded="md"
                _hover={{ bg: "none" }}
                mt={isMobile ? 4 : 0}
                display="inline-flex"
                alignItems="center"
                gap={2}
              >
                {isAddressFetching ? (
                  <Spin size="small" style={{ marginRight: "5px" }} />
                ) : (
                  <Box as="i" className="fa fa-map-marker-alt" mr={2} />
                )}
                Use My Current Location
              </Button>
            </Flex>

            {/* Names */}
            <Box w="full" mt={2} mb={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box
                  w={{ base: "100%", md: "50%" }}
                >
                  <Input
                    name="firstName"
                    maxLength={50}
                    placeholder="First name"
                    value={formData.firstName}
                    onChange={onInputChange}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.firstName)}
                  />
                </Box>
                <Box
                  w={{ base: "100%", md: "50%" }}
                >
                  <Input
                    name="lastName"
                    maxLength={50}
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={onInputChange}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.lastName)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Address */}
            <Box w="full" mb={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3} w="full">
                <Box
                  w="full"
                >
                  <Input
                    name="address"
                    placeholder="Address Line 1 (House No, Building, Street)"
                    value={formData.address}
                    onChange={onInputChange}
                    maxLength={100}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.address)}
                  />
                </Box>
              </Flex>
            </Box>

            <Box w="full" mb={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3} w="full">
                <Box
                  w="full"
                >
                  <Input
                    name="address2"
                    placeholder="Address Line 2 (Apartment, Street, Area)"
                    value={formData.address2}
                    onChange={onInputChange}
                    maxLength={100}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.address2)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Country (fixed to India) + State */}
            <Box w="full" mb={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box
                  w={{ base: "100%", sm: "50%" }}
                // bg="blackAlpha.50"
                >
                  <Input
                    value={COUNTRY_NAME}
                    isDisabled
                    {...baseInputProps}
                    borderColor="black"
                    _disabled={{
                      opacity: 1,
                      bg: "transparent", // ✅ important for underline look
                      cursor: "not-allowed",
                      color: "blackAlpha.700",
                    }}
                  />
                </Box>
                <Box
                  w={{ base: "100%", sm: "50%" }}
                >
                  <Select
                    options={stateOpts}
                    value={selectedState}
                    placeholder="State"
                    styles={chakraLikeSelectStyles(!!fieldErrors.stateCode)}
                    onChange={onSelectState}
                    isSearchable
                  />
                </Box>
              </Flex>
            </Box>

            {/* City + Email */}
            <Box w="full" mb={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box
                  w={{ base: "100%", sm: "50%" }}
                >
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
                <Box
                  w={{ base: "100%", sm: "50%" }}
                >
                  <Input
                    name="pincode"
                    placeholder="Pincode / ZIP"
                    value={formData.pincode}
                    onChange={onInputChange}
                    maxLength={6}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.pincode)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Phone */}
            <Box w="full">
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box
                  w={{ base: "100%", sm: "50%" }}
                >
                  <Input
                    name="email"
                    placeholder="Enter email"
                    value={formData.email}
                    onChange={onInputChange}
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.email)}
                  />
                </Box>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Box
                    border={{
                      base: "none",
                      md: "1px solid",
                    }}
                    borderBottom="1px solid"
                    borderColor={{
                      base: "transparent",
                      md: fieldErrors.phone ? "red.500" : "black",
                    }}
                    borderBottomColor={fieldErrors.phone ? "red.500" : "black"}
                  >
                    <Flex>
                      <Box w="80px" flexShrink={0}>
                        <PhoneInput
                          country={selectedCountryCode}
                          value={phoneCode}
                          onChange={(v, c) => {
                            const next = v.startsWith("+") ? v : `+${v}`;
                            setPhoneCode(next);
                            if (c?.countryCode) setSelectedCountryCode(c.countryCode);
                          }}
                          enableSearch
                          disableDropdown={false}
                          inputStyle={{
                            width: "100%",
                            height: 40,
                            borderRadius: 0,
                            border: 0,
                            backgroundColor: isMobile ? "transparent" : "#f5f5f5",
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
                          name="phone"
                          type="number"
                          placeholder="Mobile no."
                          value={formData.phone}
                          onChange={onInputChange}
                          fontSize="14px"
                          px={3}
                          py={4}
                          border="none"
                          borderRadius="0"
                          _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                          _focus={{ boxShadow: "none", outline: "none" }}
                          _focusVisible={{ boxShadow: "none", outline: "none" }}
                          _hover={{ boxShadow: "none" }}
                        />
                      </Box>
                    </Flex>
                  </Box>

                  {fieldErrors.phone && (
                    <Text color="red.500" fontSize="10px" ml={1}>
                      {fieldErrors.phone}
                    </Text>
                  )}
                </Box>
              </Flex>
            </Box>

            {/* Actions */}
            <Box w="full">
              <Flex wrap="wrap" gap={2} mt={6}>
                <Button
                  onClick={handleBack}
                  bg="black"
                  color="white"
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="widest"
                  px={4}
                  py={2}
                  w={{ base: "100%", md: "100px" }}
                  borderRadius={0}
                  _hover={{ bg: "black" }}
                >
                  Back
                </Button>
                <Button
                  onClick={onSave}
                  isDisabled={isSubmitting}
                  bg="black"
                  color="white"
                  fontSize="sm"
                  textTransform="uppercase"
                  letterSpacing="wider"
                  px={4}
                  py={2}
                  w={{ base: "100%", md: "100px" }}
                  borderRadius={0}
                  _hover={{ bg: "black" }}
                  isLoading={isSubmitting}
                  loadingText="Adding..."
                >
                  Add
                </Button>
              </Flex>
            </Box>
          </Box>
        </Flex>
      </Box>
      <Footer />
    </Fragment>
  );
};

export default Addaddress;

