import { Fragment, useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link as RouterLink } from "react-router-dom";
import Select from "react-select";
import { chakraLikeSelectStyles, customStyles } from "../Shipping/SelectCss";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Spin } from "antd";
import { ProfileSideBar } from "@/components/layouts";
import { useMobile } from "@/components/molecules";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import leftArrow from "@/assets/images/left-arrow.png";
import {
  getFrontendPreferences,
  buildStateOptions,
  buildCityOptions,
} from "@/api/services/sfccPreferences";
import { getAuthToken, getCustomerId } from "@/utils/tokenUtils";
import { SFCC_CONFIG } from "@/api/services";
// import { getSiteConfig } from "@/utils/sfccSiteConfig";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Input,
  Checkbox,
  Image,
  Link,
} from "@chakra-ui/react";
import Footer from "@/NewHomePage/components/footer/Footer";
import InsideNavbar from "@/components/layouts/InsideNavbar";
import LogoNavbar from "@/components/layouts/LogoNavbar";

const baseInputProps = {
  px: 3,
  py: { base: 3, md: 4 },
  fontSize: "sm",
  color: "black",
  borderRadius: 0,

  // ✅ mobile: underline only, desktop: full border
  border: { base: "none", md: "1px solid" },
  borderBottom: "1px solid",
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

const getInputErrorProps = (hasError) => {
  const color = hasError ? "red.500" : "black";

  return {
    border: {
      base: "none",
      md: "1px solid",
    },
    borderBottom: "1px solid",

    borderColor: {
      base: "transparent",
      md: color,
    },
    borderTopColor: {
      base: "transparent",
      md: color,
    },
    borderRightColor: {
      base: "transparent",
      md: color,
    },
    borderLeftColor: {
      base: "transparent",
      md: color,
    },
    borderBottomColor: color,

    _hover: {
      border: {
        base: "none",
        md: "1px solid",
      },
      borderBottom: "1px solid",
      borderColor: {
        base: "transparent",
        md: color,
      },
      borderTopColor: {
        base: "transparent",
        md: color,
      },
      borderRightColor: {
        base: "transparent",
        md: color,
      },
      borderLeftColor: {
        base: "transparent",
        md: color,
      },
      borderBottomColor: color,
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
        base: "transparent",
        md: color,
      },
      borderTopColor: {
        base: "transparent",
        md: color,
      },
      borderRightColor: {
        base: "transparent",
        md: color,
      },
      borderLeftColor: {
        base: "transparent",
        md: color,
      },
      borderBottomColor: color,
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
        base: "transparent",
        md: color,
      },
      borderTopColor: {
        base: "transparent",
        md: color,
      },
      borderRightColor: {
        base: "transparent",
        md: color,
      },
      borderLeftColor: {
        base: "transparent",
        md: color,
      },
      borderBottomColor: color,
    },
  };
};

const EditAddress = () => {
  const { id: addressIdFromRoute } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useMobile();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    address2: "",
    city: "",
    pincode: "",
    stateCode: "",
    countryCode: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  // selects show the values fetched (no external loaders)
  const [countryOptions, setCountryOptions] = useState([]);
  const [prefs, setPrefs] = useState(null); // ✅ Added prefs
  const [stateOptions, setStateOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressFetching, setIsAddressFetching] = useState(false);
  const [isLocationButtonDisabled, setIsLocationButtonDisabled] = useState(false);

  // ✅ phone – same pattern as EditAddress
  const [phoneValue, setPhoneValue] = useState(""); // Subscriber number
  const [phoneCode, setPhoneCode] = useState("+91"); // Dial code
  const [phoneFlag, setPhoneFlag] = useState("in");

  const { dialCode: SITE_DIAL_CODE } = +91;
  const [isDefault, setIsDefault] = useState(false);

  const handleBack = () => navigate(-1);

  const buildCustomerUrl = (customerId) =>
    `${SFCC_CONFIG.baseUrl}/customer/shopper-customers/v1/organizations/${SFCC_CONFIG.organizationId}/customers/${customerId}?siteId=${SFCC_CONFIG.siteId}`;

  const buildAddressUrl = (customerId, addressId) =>
    `${SFCC_CONFIG.baseUrl}/customer/shopper-customers/v1/organizations/${SFCC_CONFIG.organizationId}/customers/${customerId}/addresses/${addressId}?siteId=${SFCC_CONFIG.siteId}`;

  const toDigits = (s) => (s || "").toString().replace(/[^\d]/g, "");

  const getCompletePhone = () => {
    const raw = phoneValue || "";
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

          const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
          const data = await res.json();

          if (data.status === "OK" && data.results?.[0]) {
            const result = data.results[0];
            const comps = result.address_components;
            const getComp = (type) => comps.find((c) => c.types.includes(type))?.long_name || "";

            let street = getComp("route");
            const streetNum = getComp("street_number");
            if (streetNum) street = `${streetNum}, ${street}`;
            if (!street) street = result.formatted_address; // Fallback

            const postcode = getComp("postal_code");
            const stateName = getComp("administrative_area_level_1");
            const cityName = getComp("locality") || getComp("administrative_area_level_2");

            let newStateCode = "";
            let newCity = cityName || "";

            if (stateName && stateOptions.length > 0) {
              const matchedState = stateOptions.find(
                (s) =>
                  String(s.label).toLowerCase() === stateName.toLowerCase() ||
                  String(s.value).toLowerCase() === stateName.toLowerCase()
              );

              if (matchedState) {
                newStateCode = matchedState.value;

                if (prefs) {
                  const cities = buildCityOptions(prefs, newStateCode);
                  setCityOptions(cities);

                  const matchedCity = cities.find(
                    (c) =>
                      String(c.label).toLowerCase() === String(cityName).toLowerCase() ||
                      String(c.value).toLowerCase() === String(cityName).toLowerCase()
                  );

                  newCity = matchedCity ? matchedCity.value : cityName;
                }
              }
            }

            setFormData((prev) => ({
              ...prev,
              address: street || prev.address,
              pincode: postcode || prev.pincode,
              stateCode: newStateCode || prev.stateCode,
              city: newCity || prev.city,
            }));

            // toast.success("Location retrieved successfully. Please verify State and City.");
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

  // ---------- GET address
  const loadAddress = async () => {
    if (!addressIdFromRoute) return;
    setIsAddressFetching(true);
    try {
      const [accessToken, customerId] = await Promise.all([
        getAuthToken(),
        getCustomerId(),
      ]);
      if (!accessToken || !customerId) {
        // toast.error("You need to be logged in to edit an address.");
        return;
      }

      const resp = await fetch(
        buildAddressUrl(customerId, addressIdFromRoute),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      if (!resp.ok)
        throw new Error(
          `Fetch address failed: ${resp.status} - ${await resp.text()}`
        );

      const a = await resp.json();

      const mapped = {
        firstName: a.firstName ?? "",
        lastName: a.lastName ?? "",
        email: a.c_email ?? "",
        // phone: a.phone || "", // Handled separately
        address: a.address1 ?? "",
        address2: a.address2 ?? "",
        city: a.city ?? "",
        pincode: a.postalCode ?? "",
        stateCode: a.stateCode ?? "",
        countryCode: a.countryCode ?? "",
      };
      setFormData((prev) => ({ ...prev, ...mapped }));

      setCountryOptions(
        mapped.countryCode
          ? [{ label: mapped.countryCode, value: mapped.countryCode }]
          : []
      );

      // ✅ phone + flag logic
      const normalizedPhone = toDigits(a.phone);
      const dc = SITE_DIAL_CODE ? toDigits(SITE_DIAL_CODE) : "91";

      if (normalizedPhone.startsWith(dc)) {
        setPhoneCode(dc);
        setPhoneValue(normalizedPhone.slice(dc.length));
      } else {
        setPhoneCode(dc);
        setPhoneValue(normalizedPhone);
      }

      setPhoneFlag(
        mapped.countryCode && mapped.countryCode.length === 2
          ? mapped.countryCode.toLowerCase()
          : "in"
      );

      setIsDefault(!!a.c_isDefault);

      // Force default if navigated with state
      if (location.state?.setAsDefault) {
        setIsDefault(true);
      }

    } catch (e) {
      // toast.error("Failed to load address.");
    } finally {
      setIsAddressFetching(false);
    }
  };

  useEffect(() => {
    loadAddress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addressIdFromRoute]);

  // ---------- PATCH address
  const updateAddress = async () => {
    if (isSubmitting) return;

    const errors = {};
    let isValid = true;

    if (!formData.firstName?.trim()) { errors.firstName = true; isValid = false; }
    else if (formData.firstName.length > 50) { errors.firstName = true; isValid = false; }

    if (!formData.lastName?.trim()) { errors.lastName = true; isValid = false; }
    else if (formData.lastName.length > 50) { errors.lastName = true; isValid = false; }

    if (!formData.email?.trim()) { errors.email = true; isValid = false; }
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) { errors.email = true; isValid = false; }

    if (!phoneValue?.trim()) {
      errors.phone = "Phone number is required";
      isValid = false;
    } else {
      const phone = phoneValue.trim();
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
    // if (!formData.stateCode) { errors.stateCode = true; isValid = false; }
    // if (!formData.city) { errors.city = true; isValid = false; }

    setFieldErrors(errors);
    if (!isValid) return;

    setIsSubmitting(true);
    try {
      const [accessToken, customerId] = await Promise.all([
        getAuthToken(),
        getCustomerId(),
      ]);
      if (!accessToken || !customerId) {
        // toast.error("You need to be logged in to update an address.");
        return;
      }


      const payload = {
        addressId: addressIdFromRoute,
        address1: formData.address || "",
        address2: formData.address2 || "",
        city: formData.city || "",
        ...(formData.countryCode
          ? { countryCode: formData.countryCode.toUpperCase() }
          : {}),
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: getCompletePhone(),
        postalCode: formData.pincode || "",
        stateCode: formData.stateCode || "",
        c_email: formData.email || "",
        c_isDefault: !!isDefault,
      };

      const resp = await fetch(
        buildAddressUrl(customerId, addressIdFromRoute),
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );
      if (!resp.ok)
        throw new Error(`Update failed: ${resp.status} - ${await resp.text()}`);

      // toast.success("Address updated successfully.");
      navigate("/customer-address");
    } catch (e) {
      // toast.error("Failed to save address. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (value) setFieldErrors((p) => ({ ...p, [name]: false }));
  };

  // ✅ New Handlers for Dropdowns
  const onSelectState = (opt) => {
    const codeOrName = opt?.value || "";
    setFormData((p) => ({ ...p, stateCode: codeOrName, city: "" }));
    // Immediately update city options for the new state
    if (prefs) {
      setCityOptions(buildCityOptions(prefs, codeOrName));
    }
    setFieldErrors((p) => ({ ...p, stateCode: false }));
  };

  const onSelectCity = (opt) => {
    setFormData((p) => ({ ...p, city: opt?.value || "" }));
    setFieldErrors((p) => ({ ...p, city: false }));
  };

  // ✅ Load Preferences
  useEffect(() => {
    (async () => {
      try {
        const data = await getFrontendPreferences();
        setPrefs(data);
        setStateOptions(buildStateOptions(data));
      } catch (err) {
        // toast.error("Failed to load preferences");
      }
    })();
  }, []);

  // ✅ Sync City Options when address loads or prefs load
  useEffect(() => {
    if (prefs && formData.stateCode) {
      setCityOptions(buildCityOptions(prefs, formData.stateCode));
    }
  }, [prefs, formData.stateCode]);

  return (
    <Fragment>
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
            textTransform={"uppercase"}
          >
            My Account / Address
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 14, md: 7 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"ADDRESS"} />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Desktop header row */}
            <Flex
              justify="space-between"
              align="center"
              pb="20px"
            >
              <Text fontWeight="600" mb={0} display={{ base: "none", md: "flex" }}>
                EDIT ADDRESS
              </Text>
              <Link
                as={RouterLink}
                to="/customer-address"
                textTransform="uppercase"
                fontWeight="medium"
                display={{ base: "flex", md: "none" }}
                alignItems="center"
                fontSize="sm"
              >
                <Image src={leftArrow} alt="Back" w="16px" mr={2} />
                EDIT ADDRESS
              </Link>
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

            {/* Name */}
            <Box w="full">
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Input
                    name="firstName"
                    maxLength={50}
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First Name"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.firstName)}
                  />
                </Box>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Input
                    name="lastName"
                    maxLength={50}
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last Name"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.lastName)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Address  */}
            <Box w="full" mt={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box w="full">
                  <Input
                    name="address"
                    maxLength={100}
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.address)}
                  />
                </Box>
              </Flex>
            </Box>

            <Box w="full" mt={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box w="full">
                  <Input
                    name="address2"
                    value={formData.address2}
                    onChange={handleInputChange}
                    maxLength={100}
                    placeholder="Address Line 2 (Apartment, Street, Area)"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.address2)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Country + State */}
            <Box w="full" mt={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box w={{ base: "100%", sm: "50%" }}
                // bg="blackAlpha.50"
                >
                  <Input
                    value='India'
                    isDisabled
                    {...baseInputProps}
                    borderColor="black"
                    _disabled={{
                      opacity: 1,
                      bg: "transparent",     // ✅ underline look
                      cursor: "not-allowed",
                      color: "blackAlpha.700",
                    }}
                  />
                </Box>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Select
                    options={stateOptions}
                    value={
                      (stateOptions || []).find(
                        (s) =>
                          String(s.value).toLowerCase() === String(formData.stateCode).toLowerCase() ||
                          String(s.label).toLowerCase() === String(formData.stateCode).toLowerCase()
                      ) || null
                    }
                    styles={chakraLikeSelectStyles(!!fieldErrors.stateCode)}
                    placeholder="State"
                    onChange={onSelectState}
                    isSearchable
                  />
                </Box>
              </Flex>
            </Box>

            {/* City + Email */}
            <Box w="full" mt={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3}>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Select
                    options={cityOptions}
                    value={
                      (cityOptions || []).find(
                        (c) =>
                          String(c.value).toLowerCase() === String(formData.city).toLowerCase() ||
                          String(c.label).toLowerCase() === String(formData.city).toLowerCase()
                      ) ||
                      (formData.city
                        ? {
                          label: formData.city,
                          value: formData.city,
                        }
                        : null)
                    }
                    styles={chakraLikeSelectStyles(!!fieldErrors.city)}
                    placeholder="City"
                    onChange={onSelectCity}
                    isSearchable
                  />
                </Box>
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Input
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength={6}
                    placeholder="Pincode / PO Box"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.pincode)}
                  />
                </Box>
              </Flex>
            </Box>

            {/* Phone */}
            <Box w="full" mt={3}>
              <Flex direction={{ base: "column", sm: "row" }} gap={3} w="full">
                <Box w={{ base: "100%", sm: "50%" }}>
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    {...baseInputProps}
                    {...getInputErrorProps(!!fieldErrors.email)}
                  />
                </Box>

                <Box w={{ base: "100%", sm: "50%" }}>
                  <Box
                    border="1px solid"
                    borderColor={fieldErrors.phone ? "red.500" : "black"}
                    borderRadius="0"
                    sx={{
                      "@media (max-width: 768px)": {
                        border: "none",
                        borderBottom: `1px solid ${fieldErrors.phone ? "#E53E3E" : "#000000"
                          }`,
                      },
                    }}
                  >
                    <Flex w="full">
                      <Box w="80px" flexShrink={0}>
                        <PhoneInput
                          country={phoneFlag || "in"}
                          value={phoneCode}
                          onChange={(v, c) => {
                            const next = v.startsWith("+") ? v : `+${v}`;
                            setPhoneCode(next);
                            if (c?.countryCode) setPhoneFlag(c.countryCode);
                          }}
                          enableSearch
                          disableDropdown={false}
                          inputStyle={{
                            width: "100%",
                            height: 40,
                            borderRadius: 0,
                            border: 0,
                            backgroundColor: isMobile ? "transparent" : "#f5f5f5",
                            color: "black",
                          }}
                          buttonStyle={{
                            borderRadius: 0,
                            border: 0,
                            backgroundColor: "transparent",
                          }}
                          inputProps={{ readOnly: true }}
                          disableCountryCode={true}
                        />
                      </Box>

                      <Box w="full">
                        <Input
                          type="number"
                          placeholder="Mobile no."
                          value={phoneValue}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.length <= 10) {
                              setPhoneValue(val);
                              if (val) setFieldErrors((p) => ({ ...p, phone: "" }));
                            }
                          }}
                          px={3}
                          py={4}
                          h="39px"
                          color="black"
                          fontSize="sm"
                          border="none"
                          borderRadius="0"
                          _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                          _focus={{ boxShadow: "none", outline: "none" }}
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

            {/* Default toggle */}
            <Box w="full" mt={3}>
              <Checkbox
                isChecked={isDefault}
                onChange={(e) => setIsDefault(e.target.checked)}
                iconColor="white"
                sx={{
                  ".chakra-checkbox__control": {
                    borderColor: "black",
                    _hover: { borderColor: "black" },
                    _checked: {
                      bg: "black",
                      borderColor: "black",
                      color: "white",
                      _hover: { bg: "black", borderColor: "black" },
                    },
                    _focusVisible: {
                      boxShadow: "none",
                    },
                  },
                  ".chakra-checkbox__label": { color: "black" },
                }}
              >
                Set as default address
              </Checkbox>
            </Box>

            {/* Actions */}
            <Box w="full">
              <Flex wrap="wrap" gap={2} mt={6}>
                <Button
                  onClick={handleBack}
                  bg="black"
                  color="white"
                  w={{ base: "100%", md: "180px" }}
                  borderRadius={0}
                  _hover={{ bg: "black" }}
                >
                  Back
                </Button>
                <Button
                  onClick={updateAddress}
                  isDisabled={isSubmitting}
                  bg="black"
                  color="white"
                  w={{ base: "100%", md: "180px" }}
                  borderRadius={0}
                  _hover={{ bg: "black" }}
                  isLoading={isSubmitting}
                  loadingText="Saving..."
                >
                  Save Changes
                </Button>
              </Flex>
            </Box>
          </Box>
        </Flex >
      </Box >

      <Footer />
    </Fragment >
  );
};

export default EditAddress;
