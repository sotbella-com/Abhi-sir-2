import React, { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useLocation } from "react-router-dom";
import Select from "react-select";
import { chakraLikeSelectStyles, customStyles as customStylesSelect } from "./SelectCss";
import { toast } from "react-toastify";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Spin } from "antd";

import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Link,
  Input,
  Checkbox,
} from "@chakra-ui/react";

import {
  getFrontendPreferences,
  buildStateOptions,
  buildCityOptions,
} from "@/api/services/sfccPreferences";

import InsideNavbar from "@/components/layouts/InsideNavbar";
import { useAddressStore, useAuth } from "@/context";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";

// SFCC auth + config
import { getAuthToken, getCustomerId } from "@/utils/tokenUtils";
import { SFCC_CONFIG } from "@/api/services";
import CartCouponAndPricingSection from "../Cart/cartCouponAndPricing";

const baseInputProps = {
  px: 3,
  py: { base: 3, md: 2 },
  fontSize: "sm",
  color: "black",
  borderRadius: 0,

  borderWidth: {
    base: "0 0 1px 0",
    md: "1px",
  },
  borderStyle: "solid",
  borderColor: "black",

  _placeholder: { color: "rgba(0,0,0,0.30)" },

  _focus: {
    boxShadow: "none",
    outline: "none",
    borderWidth: {
      base: "0 0 1px 0",
      md: "1px",
    },
    borderStyle: "solid",
    borderColor: "black",
  },

  _focusVisible: {
    boxShadow: "none",
    outline: "none",
    borderWidth: {
      base: "0 0 1px 0",
      md: "1px",
    },
    borderStyle: "solid",
    borderColor: "black",
  },

  _hover: {
    borderWidth: {
      base: "0 0 1px 0",
      md: "1px",
    },
    borderStyle: "solid",
    borderColor: "black",
    boxShadow: "none",
  },
};

const getErrorBorderProps = (hasError) => {
  const color = hasError ? "red.500" : "black";

  return {
    borderWidth: {
      base: "0 0 1px 0",
      md: "1px",
    },
    borderStyle: "solid",
    borderColor: color,

    _focus: {
      boxShadow: "none",
      outline: "none",
      borderWidth: {
        base: "0 0 1px 0",
        md: "1px",
      },
      borderStyle: "solid",
      borderColor: color,
    },

    _focusVisible: {
      boxShadow: "none",
      outline: "none",
      borderWidth: {
        base: "0 0 1px 0",
        md: "1px",
      },
      borderStyle: "solid",
      borderColor: color,
    },

    _hover: {
      borderWidth: {
        base: "0 0 1px 0",
        md: "1px",
      },
      borderStyle: "solid",
      borderColor: color,
      boxShadow: "none",
    },
  };
};

const EditShippingAddress = ({
  isModal = false,
  addressId,              // ✅ passed from modal
  onClose,                // ✅ callback to parent
}) => {
  const { id: addressIdFromRoute } = useParams();
  const effectiveAddressId = addressId ?? addressIdFromRoute;
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useAddressStore();
  const { isAuthenticated } = useAuth();
  const { basket } = useUnifiedCartStore();

  // --- form state (values come from SFCC)
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

  const [isAddressFetching, setIsAddressFetching] = useState(false);
  const [isLocationButtonDisabled, setIsLocationButtonDisabled] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ phone – same pattern as EditAddress
  const [phoneValue, setPhoneValue] = useState(""); // Subscriber number
  const [phoneCode, setPhoneCode] = useState("+91"); // Dial code
  const [phoneFlag, setPhoneFlag] = useState("in");

  const { dialCode: SITE_DIAL_CODE } = '91';

  // default toggle maps to c_isDefault
  const [isDefault, setIsDefault] = useState(false);



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
            let newCity = "";

            // Auto-select State
            // Note: stateOptions/cityOptions need to be populated or handled if not loaded yet.
            // In EditShippingAddress, we might need to rely on the loaded options or re-fetch prefs if needed.
            // For simplicity, we'll try to match against existing stateOptions if they are loaded.

            if (stateName) {
              // We need prefs to lookup properly, similar to Shippingmid1. 
              // EditShippingAddress doesn't load prefs in the same way initially (it loads from address).
              // But we can check if we have them. If not, we might need to load valid states.

              // Let's assume for now we just map the codes we found.
              // Ideally we should refactor the prefs loading to be shared or ensure it's available.
              // However, to match Shippingmid1 logic, we try to match:

              // NOTE: EditShippingAddress uses `stateOptions` which are set from `loadAddress`.
              // We might need to fetch all state options to match against.
            }

            setFormData((prev) => ({
              ...prev,
              address: street || prev.address,
              pincode: postcode || prev.pincode,
              city: cityName || prev.city, // If no match logic, just set raw or empty
              // stateCode: newStateCode || prev.stateCode, // logic complex without prefs loaded
            }));

            // Since EditShippingAddress structure is slightly different (options state depends on fetched address), 
            // fully replicating the auto-select logic might require more changes.
            // For now, let's at least populate the text fields and basic matches.

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

  // ---------- GET shipping address 
  const loadAddress = async () => {
    if (!effectiveAddressId) return;
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
        buildAddressUrl(customerId, effectiveAddressId),
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
        address: a.address1 ?? "",
        address2: a.address2 ?? "",
        city: a.city ?? "",
        pincode: a.postalCode ?? "",
        stateCode: a.stateCode ?? "",
        countryCode: a.countryCode ?? "",
        phone: a.phone || "",
      };
      setFormData((prev) => ({
        ...prev,
        ...mapped,
      }));

      // selections wired to SFCC values
      setCountryOptions(
        mapped.countryCode
          ? [{ label: mapped.countryCode, value: mapped.countryCode }]
          : []
      );
      // ❌ Removed manual state/city options setting to rely on prefs
      // setStateOptions(...) 
      // setCityOptions(...)

      // ✅ phone + flag
      const normalizedPhone = toDigits(mapped.phone);

      // Attempt to split: site dial code vs rest
      const dc = SITE_DIAL_CODE ? toDigits(SITE_DIAL_CODE) : "91";

      if (normalizedPhone.startsWith(dc)) {
        setPhoneCode(dc);
        setPhoneValue(normalizedPhone.slice(dc.length));
      } else {
        // Fallback: just use site code and put entire thing in value (user can fix)
        setPhoneCode(dc);
        setPhoneValue(normalizedPhone);
      }

      setPhoneFlag(
        mapped.countryCode && mapped.countryCode.length === 2
          ? mapped.countryCode.toLowerCase()
          : "in"
      );

      setIsDefault(!!a.preferred || !!a.c_isDefault);

      // fallback to customer phones if address phone is empty
      if (!normalizedPhone) {
        const cResp = await fetch(buildCustomerUrl(customerId), {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        });
        if (cResp.ok) {
          const cust = await cResp.json();
          const fallback = toDigits(
            cust.phoneMobile ||
            cust.phoneHome ||
            cust.phoneBusiness ||
            cust.phone ||
            ""
          );
          if (fallback) {
            setPhoneValue(fallback);
          }
        }
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
  }, [effectiveAddressId]);

  // ---------- PATCH 
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
        addressId: effectiveAddressId,
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
        preferred: !!isDefault,
      };

      const resp = await fetch(
        buildAddressUrl(customerId, effectiveAddressId),
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

      // ✅ success handling depends on mode
      if (isModal) {
        onClose?.(true); // tell parent "saved"
      } else {
        navigate({ pathname: "/address", search: location.search });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ Back/Close handler
  const handleBack = () => {
    if (isModal) {
      onClose?.(false);
    } else {
      navigate({ pathname: "/address", search: location.search });
    }
  };

  // UI handlers
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

  const selectedCity =
    cityOptions.find(
      (c) =>
        String(c.value).toLowerCase() === String(formData.city).toLowerCase() ||
        String(c.label).toLowerCase() === String(formData.city).toLowerCase()
    ) ||
    (formData.city
      ? {
        label: formData.city,
        value: formData.city,
      }
      : null);

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
      const cities = buildCityOptions(prefs, formData.stateCode);
      setCityOptions(cities);
    }
  }, [prefs, formData.stateCode]);

  const handleClick = (event) => {
    event.preventDefault();
    if (address?.length > 0) {
      navigate({ pathname: "/address", search: location.search });
    } else {
      if (isAuthenticated) navigate({ pathname: "/Shipping", search: location.search });
    }
  };

  return (
    <Fragment>
      {/* ✅ Hide navbar in modal */}
      {!isModal && (
        <Box mt={{ base: 6, lg: "120px" }}>
          <InsideNavbar />
        </Box>
      )}

      <Box w="full" px={{ base: "12px", lg: "50px" }} my={5} textAlign="left">
        <Flex flexDirection={{ base: "column", lg: "row" }} gap={{ base: 5, lg: 10 }} pt={{ base: 4, lg: 0 }}>
          <Box w={{ base: "100%", lg: isModal ? "100%" : "50%" }}>
            <Box w="full" mt={{ base: 8, lg: 0 }}>
              <Flex mb={2} mt={3} justify="space-between" align="center">
                <Text
                  textTransform="uppercase"
                  fontWeight="normal"
                  fontSize={{ base: "sm", sm: "lg" }}
                >
                  Edit Shipping Address
                </Text>

                <Button
                  variant="outline"
                  borderColor="black"
                  color="black"
                  size="sm"
                  px={4}
                  py={2}
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

              {/* FORM */}
              <Box as="form" w="full">
                <Grid
                  templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
                  gap={3}
                  color="blackAlpha.800"
                >
                  <GridItem>
                    <Input
                      name="firstName"
                      maxLength={50}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      placeholder="First Name"
                      {...baseInputProps}
                      {...getErrorBorderProps(!!fieldErrors.firstName)}
                    />
                  </GridItem>

                  <GridItem>
                    <Input
                      name="lastName"
                      maxLength={50}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      placeholder="Last name"
                      {...baseInputProps}
                      {...getErrorBorderProps(!!fieldErrors.lastName)}
                    />
                  </GridItem>

                  <GridItem colSpan={{ base: 1, lg: 2 }}>
                    <Input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      maxLength={100}
                      placeholder="House Number and Street Name"
                      {...baseInputProps}
                      {...getErrorBorderProps(!!fieldErrors.address)}
                    />
                  </GridItem>

                  <GridItem colSpan={{ base: 1, lg: 2 }}>
                    <Input
                      name="address2"
                      value={formData.address2}
                      onChange={handleInputChange}
                      maxLength={100}
                      placeholder="Address Line 2 (Apartment, Street, Area)"
                      {...baseInputProps}
                      {...getErrorBorderProps(!!fieldErrors.address2)}
                    />
                  </GridItem>

                  {/* Country (display only) */}
                  <GridItem>
                    <Input
                      value={'India'}
                      isDisabled
                      {...baseInputProps}
                      borderColor="black"
                      _disabled={{
                        opacity: 1,
                        bg: "transparent",      // ✅ keeps underline look on mobile
                        cursor: "not-allowed",
                        color: "blackAlpha.700",
                      }}
                    />
                  </GridItem>

                  {/* State */}
                  <GridItem>
                    <Select
                      options={stateOptions}
                      styles={chakraLikeSelectStyles(!!fieldErrors.stateCode)}
                      placeholder="State"
                      value={
                        (stateOptions || []).find(
                          (s) =>
                            String(s.value).toLowerCase() === String(formData.stateCode).toLowerCase() ||
                            String(s.label).toLowerCase() === String(formData.stateCode).toLowerCase()
                        ) || null
                      }
                      onChange={onSelectState}
                      isSearchable
                    />
                  </GridItem>

                  {/* City */}
                  <GridItem>
                    <Select
                      options={cityOptions}
                      styles={chakraLikeSelectStyles(!!fieldErrors.city)}
                      placeholder="City"
                      value={selectedCity}
                      onChange={onSelectCity}
                      isSearchable
                    />
                  </GridItem>

                  {/* Pincode */}
                  <GridItem>
                    <Input
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      maxLength={6}
                      placeholder="Pincode"
                      {...baseInputProps}
                      h={10}
                      {...getErrorBorderProps(!!fieldErrors.pincode)}
                    />
                  </GridItem>

                  {/* Email */}
                  <GridItem>
                    <Input
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="E-mail"
                      {...baseInputProps}
                      h={10}
                      {...getErrorBorderProps(!!fieldErrors.email)}
                    />
                  </GridItem>

                  {/* Phone - Split UI like AddAddress */}
                  <GridItem>
                    <Box
                      w="full"
                      borderWidth={{
                        base: "0 0 1px 0",
                        md: "1px",
                      }}
                      borderStyle="solid"
                      borderColor={fieldErrors.phone ? "red.500" : "black"}
                    >
                      <Flex>
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
                              backgroundColor: "transparent", // ✅ underline look on mobile
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
                            name="phone"
                            type="number"
                            placeholder="Mobile no."
                            value={phoneValue}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.length <= 10) {
                                setPhoneValue(val);
                                if (val) setFieldErrors((p) => ({ ...p, phone: false }));
                              }
                            }}
                            fontSize={"14px"}
                            px={3}
                            py={{ base: 3, md: 2 }}
                            h={10}
                            border="0"
                            borderRadius={0}
                            color="black"
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
                  </GridItem>

                  {/* Default address */}
                  <GridItem colSpan={{ base: 1, lg: 2 }}>
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
                  </GridItem>
                </Grid>

                {/* Buttons */}
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  gap={2}
                  mt={4}
                >
                  <Button
                    type="button"
                    onClick={handleBack}     // ✅ use back handler
                    bg="black"
                    color="white"
                    textTransform="uppercase"
                    px={4}
                    py={2.5}
                    fontSize={{ base: "xs", lg: "sm" }}
                    w={{ base: "100%", sm: "120px" }}
                    _hover={{ bg: "black" }}
                    borderRadius={0}
                  >
                    Back
                  </Button>

                  <Button
                    type="button"
                    onClick={updateAddress}
                    isDisabled={isSubmitting}
                    flex="1"
                    bg="black"
                    color="white"
                    textTransform="uppercase"
                    px={4}
                    py={2.5}
                    fontSize={{ base: "xs", lg: "sm" }}
                    _hover={{ bg: "blackAlpha.900" }}
                    borderRadius={0}
                  >
                    {isSubmitting ? "Saving..." : "Save changes"}
                  </Button>
                </Flex>

                {/* Legal */}
                <Text
                  textAlign="center"
                  fontWeight="normal"
                  fontSize="xs"
                  lineHeight="short"
                  my={3}
                >
                  By submitting, you agree to the{" "}
                  <Link
                    as={RouterLink}
                    to="/terms"
                    fontWeight="semibold"
                    textDecor="underline"
                  >
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    as={RouterLink}
                    to="/privacypolicy"
                    fontWeight="semibold"
                    textDecor="underline"
                  >
                    Privacy Policy
                  </Link>
                  .
                </Text>
              </Box>
            </Box>
          </Box>

          {/* ✅ Right summary only in page mode */}
          {!isModal && (
            <Box w={{ base: "full", lg: "50%" }}>
              <CartCouponAndPricingSection
                seeMoreClick={() => { }}
                setHandleSeeMore={() => { }}
                bottomRef={{ current: null }}
                buttonTitle="Pay Now"
                onButtonClick={handleClick}
                isButtonDisable={true}
                selectedItems={basket?.productItems || []}
              />
            </Box>
          )}
        </Flex>
      </Box>
    </Fragment>
  );
};

export default EditShippingAddress;
