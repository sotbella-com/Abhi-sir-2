import { Fragment, useState, useEffect } from "react";
import leftArrow from "@/assets/images/left-arrow.png";
import { toast } from "react-toastify";
import { ProfileSideBar } from "@/components/layouts";
import { useAuth } from "@/context/AuthContext";
import { useMobile } from "@/components/molecules";
import { DatePicker } from "antd";
import dayjs from "dayjs";

// SFCC service
import { getCustomerMe, updateCustomerDetails } from "@/api/services/sfccCustomers";

import {
  Box,
  Flex,
  Grid,
  GridItem,
  Heading,
  Text,
  Button,
  Input,
  Select as ChakraSelect,
} from "@chakra-ui/react";

/* ============ black/white inline radios & checkbox  ============ */
const RadioBW = ({ name, value, checked, onChange, label }) => {
  const labelStyle = { display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" };
  const inputStyle = { position: "absolute", opacity: 0, width: 0, height: 0, margin: 0, pointerEvents: "none" };
  const ringStyle = { width: 16, height: 16, boxSizing: "border-box", border: "1.5px solid #000", borderRadius: "50%", background: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" };
  const dotStyle = { width: 8, height: 8, borderRadius: "50%", background: checked ? "#000" : "transparent", transform: checked ? "scale(1)" : "scale(0.1)", transition: "transform 120ms ease-in-out, background 120ms ease-in-out" };
  return (
    <label style={labelStyle}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={inputStyle} />
      <span style={ringStyle}><span style={dotStyle} /></span>
      <span style={{ fontSize: 14, color: "#000" }}>{label}</span>
    </label>
  );
};

const CheckboxBW = ({ id, checked, onChange, label }) => {
  const labelStyle = { display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", userSelect: "none" };
  const inputStyle = { position: "absolute", opacity: 0, width: 0, height: 0, margin: 0, pointerEvents: "none" };
  const boxStyle = { width: 14, height: 14, boxSizing: "border-box", border: "1.5px solid #000", borderRadius: 0, background: checked ? "#000" : "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", transition: "background 120ms ease-in-out, border-color 120ms ease-in-out" };
  return (
    <label htmlFor={id} style={labelStyle}>
      <input id={id} type="checkbox" checked={checked} onChange={onChange} style={inputStyle} />
      <span style={boxStyle}>
        {checked ? (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2.5 6.5l2 2 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : null}
      </span>
      <span style={{ fontSize: 14, color: "#343434" }}>{label}</span>
    </label>
  );
};
/* ======================================================================== */

const genderStrToNum = (g) => (g === "male" ? 1 : g === "female" ? 2 : 0);
const genderNumToStr = (n) => (n === 1 ? "male" : n === 2 ? "female" : "");
const disableFuture = (current) => current && current > dayjs().endOf("day");

const AccountDetailsForm = () => {
  const { user } = useAuth();
  const isMobile = useMobile();
  const [dobLocked, setDobLocked] = useState(false);
  const [anniversaryLocked, setAnniversaryLocked] = useState(false);
  const [basicDetailsUpdate, setBasicDetailsUpdate] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    anniversary: "",
    gender: "",
    isNewsletterSubscribed: false,
    receiveOrderUpdates: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Prefill from SFCC
  useEffect(() => {
    (async () => {
      try {
        const me = await getCustomerMe();
        setBasicDetailsUpdate((prev) => ({
          ...prev,
          firstName: me.firstName ?? "",
          lastName: me.lastName ?? "",
          email: me.email ?? "",               // disabled input
          phone: me.phoneMobile || me.phone || "", // disabled input
          dob: me.birthday ?? "",            // will show if present
          anniversary: me.c_anniversaryDate ?? "",
          gender: genderNumToStr(me.gender ?? 0),
          isNewsletterSubscribed: !!me.c_newsletterSubscribed,
          receiveOrderUpdates: !!me.c_receiveOrderUpdates,
        }));
        setDobLocked(!!me.birthday);
        setAnniversaryLocked(!!me.c_anniversaryDate);
      } catch (err) {
        // toast.error("Failed to load account details");
      }
    })();
  }, []);

  const MAX_NAME = 50;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBasicDetailsUpdate((prev) => {
      // ✅ first/last name max 20 characters (typing + paste)
      if (name === "firstName" || name === "lastName") {
        return { ...prev, [name]: value.slice(0, MAX_NAME) };
      }

      // keep your email no-spaces logic
      if (name === "email") {
        return { ...prev, email: value.replace(/\s/g, "") };
      }

      return { ...prev, [name]: value };
    });
    if (value) setFieldErrors((prev) => ({ ...prev, [name]: false }));
  };

  const handleDateChange = (date) => {
    setBasicDetailsUpdate((prev) => ({ ...prev, dob: date ? date.format("YYYY-MM-DD") : "" }));
    if (date) setFieldErrors((prev) => ({ ...prev, dob: false }));
  };

  const handleAnniversaryChange = (date) => {
    setBasicDetailsUpdate((prev) => ({ ...prev, anniversary: date ? date.format("YYYY-MM-DD") : "" }));
    if (date) setFieldErrors((prev) => ({ ...prev, anniversary: false }));
  };

  const updateBasicDetails = async () => {
    const nameRegex = /^[A-Za-z\s]{3,}$/;
    const { firstName, lastName, dob, anniversary, gender, isNewsletterSubscribed, receiveOrderUpdates } = basicDetailsUpdate;
    const errors = {};
    let isValid = true;

    if (!firstName || !nameRegex.test(firstName.trim())) { errors.firstName = true; isValid = false; }
    if (!lastName || !nameRegex.test(lastName.trim())) { errors.lastName = true; isValid = false; }

    // ✅ Required: DOB
    if (!dob || !String(dob).trim()) { errors.dob = true; isValid = false; }

    // ✅ Required: Anniversary
    if (!anniversary || !String(anniversary).trim()) { errors.anniversary = true; isValid = false; }

    /*
    if (dob && dayjs(dob).isAfter(dayjs(), "day")) {
      // toast.error("Date of birth cannot be in the future.");
      return;
    }
    if (anniversary && dayjs(anniversary).isAfter(dayjs(), "day")) {
      // toast.error("Anniversary date cannot be in the future.");
      return;
    }
    */

    setFieldErrors(errors);
    if (!isValid) return;

    // Build SFCC payload exactly per your doc
    // ✅ Fix: Only include mutable fields. Dates are immutable if already set.
    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      gender: genderStrToNum(gender || "other"),
      c_newsletterSubscribed: !!isNewsletterSubscribed,
      c_receiveOrderUpdates: !!receiveOrderUpdates,
    };

    // Only send birthday if it wasn't previously set (not locked)
    if (!dobLocked) {
      payload.birthday = dob || "";
    }

    // Only send anniversary if it wasn't previously set (not locked)
    if (!anniversaryLocked) {
      payload.c_anniversaryDate = anniversary || "";
    }


    try {
      setIsSubmitting(true);
      await updateCustomerDetails(payload);
      // toast.success("Profile updated successfully");
      if (basicDetailsUpdate.dob && !dobLocked) {
        setDobLocked(true);
      }
      if (basicDetailsUpdate.anniversary && !anniversaryLocked) {
        setAnniversaryLocked(true);
      }
    } catch (err) {
      // toast.error("Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => window.history.back();

  /* ===========================  YOUR UI (as requested)  =========================== */
  return (
    <Fragment>
      <Box mt={isMobile ? "20px" : undefined} />
      {/* Desktop heading */}
      <Box mt="90px" display={{ base: "none", md: "block" }}>
        <Box textAlign="center">
          <Heading as="h1" fontFamily="Dm Serif Display" fontWeight="normal" fontSize="4xl" textTransform="uppercase">
            My Account / Details
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 12, md: 10 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"ACCOUNT"} />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Mobile back + title */}
            <Flex w="full" align="center" justify="space-between" fontSize="sm" mb={4} display={{ base: "flex", md: "none" }}>
              <Flex as="button" onClick={handleBack} textTransform="uppercase" fontWeight="medium" color="black" align="center">
                <Box as="img" src={leftArrow} alt="Back" w="16px" mr={5} />
                <Text>Basic Details</Text>
              </Flex>
            </Flex>

            {/* Names */}
            <Box w="full">
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                <GridItem>
                  <Box border="1px solid" borderColor={fieldErrors.firstName ? "red.500" : "#d2d2d2"}>
                    <Input
                      type="text"
                      placeholder="First Name"
                      name="firstName"
                      value={basicDetailsUpdate.firstName}
                      onChange={handleInputChange}
                      maxLength={50}
                      color={"black"}
                      h="45px"
                      border="0"
                      borderRadius="0"
                      fontSize="14px"
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _focusVisible={{ boxShadow: "none", outline: "none" }}
                      _hover={{ boxShadow: "none" }}
                    />
                  </Box>
                </GridItem>
                <GridItem>
                  <Box border="1px solid" borderColor={fieldErrors.lastName ? "red.500" : "#d2d2d2"} mb={{ base: 3, md: 0 }}>
                    <Input
                      type="text"
                      placeholder="Last Name"
                      name="lastName"
                      value={basicDetailsUpdate.lastName}
                      onChange={handleInputChange}
                      maxLength={50}
                      color={"black"}
                      h="45px"
                      border="0"
                      borderRadius="0"
                      fontSize="14px"
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _focusVisible={{ boxShadow: "none", outline: "none" }}
                      _hover={{ boxShadow: "none" }}
                    />
                  </Box>
                </GridItem>
              </Grid>
            </Box>

            {/* DOB + Email */}
            <Box w="full" mt={{ base: "0", md: "3" }}>
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                <GridItem>
                  <Box border="1px solid" borderColor={fieldErrors.dob ? "red.500" : "#d2d2d2"}>
                    <DatePicker
                      value={basicDetailsUpdate.dob ? dayjs(basicDetailsUpdate.dob) : null}
                      onChange={handleDateChange}
                      placeholder="Date of Birth"
                      format="DD MMM YYYY"
                      name="dob"
                      disabledDate={disableFuture}
                      disabled={dobLocked}
                      style={{
                        width: "100%",
                        height: 45,
                        border: "0px",
                        borderRadius: "0px",
                        color: "#000",
                        backgroundColor: dobLocked ? "#f5f5f5" : "#fff",
                      }}
                    />
                  </Box>
                </GridItem>
                <GridItem>
                  <Box border="1px solid" borderColor="#d2d2d2">
                    <Input
                      type="email"
                      placeholder="Email Id"
                      name="email"
                      value={basicDetailsUpdate.email}
                      onChange={handleInputChange}
                      fontSize="14px"
                      h="45px"
                      border="0"
                      borderRadius="0"
                      bg={"blackAlpha.100"}
                      color={"black"}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _focusVisible={{ boxShadow: "none", outline: "none" }}
                      _hover={{ boxShadow: "none" }}
                      isDisabled
                    />
                  </Box>
                </GridItem>
              </Grid>
            </Box>

            {/* Gender + Phone */}
            <Box w="full" mt={3}>
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                <GridItem>
                  <Box border="1px solid" borderColor="#d2d2d2">
                    <Input
                      type="tel"
                      placeholder="Phone Number"
                      name="phone"
                      value={basicDetailsUpdate.phone}
                      onChange={handleInputChange}
                      fontSize="14px"
                      h="45px"
                      border="0"
                      borderRadius="0"
                      bg={"blackAlpha.200"}
                      color={"black"}
                      _placeholder={{ color: "rgba(0,0,0,0.30)" }}
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _focusVisible={{ boxShadow: "none", outline: "none" }}
                      _hover={{ boxShadow: "none" }}
                      isDisabled
                    />
                  </Box>
                </GridItem>

                <GridItem>
                  <Box border="1px solid" borderColor="#d2d2d2">
                    <ChakraSelect
                      name="gender"
                      value={basicDetailsUpdate.gender || ""}
                      onChange={(e) => setBasicDetailsUpdate((p) => ({ ...p, gender: e.target.value }))}
                      h="45px"
                      border="0"
                      borderRadius="0"
                      placeholder="Select Gender"
                      fontSize="14px"
                      _focus={{ boxShadow: "none", outline: "none" }}
                      _focusVisible={{ boxShadow: "none", outline: "none" }}
                      _hover={{ boxShadow: "none" }}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </ChakraSelect>
                  </Box>
                </GridItem>
              </Grid>
            </Box>

            {/* Anniversary */}
            <Box w="full" mt={3}>
              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
                <GridItem>
                  <Box border="1px solid" borderColor={fieldErrors.anniversary ? "red.500" : "#d2d2d2"}>
                    <DatePicker
                      value={basicDetailsUpdate.anniversary ? dayjs(basicDetailsUpdate.anniversary) : null}
                      onChange={handleAnniversaryChange}
                      placeholder="Date of Anniversary"
                      format="DD MMM YYYY"
                      name="anniversary"
                      disabledDate={disableFuture}
                      disabled={anniversaryLocked}
                      style={{
                        width: "100%",
                        height: 45,
                        border: "0px",
                        borderRadius: "0px",
                        color: "#000",
                        backgroundColor: anniversaryLocked ? "#f5f5f5" : "#fff",
                      }}
                    />
                  </Box>
                </GridItem>
              </Grid>
            </Box>

            {/* Newsletter radios */}
            <Box mt={3}>
              <Flex gap={{ base: 2, md: 8 }} flexWrap="wrap">
                <RadioBW
                  name="newsletter"
                  value="true"
                  checked={!!basicDetailsUpdate.isNewsletterSubscribed}
                  onChange={(e) =>
                    setBasicDetailsUpdate((prev) => ({
                      ...prev,
                      isNewsletterSubscribed: e.target.value === "true",
                    }))
                  }
                  label="Subscribe to our newsletter"
                />
                <RadioBW
                  name="newsletter"
                  value="false"
                  checked={!basicDetailsUpdate.isNewsletterSubscribed}
                  onChange={(e) =>
                    setBasicDetailsUpdate((prev) => ({
                      ...prev,
                      isNewsletterSubscribed: e.target.value === "true",
                    }))
                  }
                  label="Unsubscribe from our newsletter"
                />
              </Flex>
            </Box>

            {/* Order Updates checkbox */}
            <Box mt={2}>
              <CheckboxBW
                id="receive-updates"
                checked={!!basicDetailsUpdate.receiveOrderUpdates}
                onChange={(e) =>
                  setBasicDetailsUpdate((prev) => ({
                    ...prev,
                    receiveOrderUpdates: e.target.checked,
                  }))
                }
                label="Receive Order Updates"
              />
            </Box>

            {/* Actions */}
            <Flex gap={2} mt={6} wrap="wrap">
              <Button
                onClick={updateBasicDetails}
                bg="#191616"
                color="white"
                fontSize="sm"
                fontWeight="medium"
                px={4}
                py={3}
                textTransform="uppercase"
                letterSpacing="widest"
                w={{ base: "100%", md: "180px" }}
                _hover={{ bg: "#000" }}
                borderRadius={0}
                isLoading={isSubmitting}
                loadingText="Saving..."
              >
                Save Changes
              </Button>
            </Flex>
          </Box>
        </Flex>
      </Box>
    </Fragment>
  );
};

export default AccountDetailsForm;
