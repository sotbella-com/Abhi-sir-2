import { useState } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { LoadingButton } from "@/components/atoms";
import { TagIcon } from "lucide-react";
import { handleNavigate } from "@/utils/url";
import { track_order } from "@/api/services/sfccOrders";
// import { get_orders_details } from "@/api/services/sfccOrders";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useQuery } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  InputGroup,
  VisuallyHidden,
  FormControl,
  HStack,
} from "@chakra-ui/react";
import Footer from "@/NewHomePage/components/footer/Footer";


/* ============ black/white inline radio ============ */
const RadioBW = ({ name, value, checked, onChange, label }) => {
  const labelStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: 10,
    cursor: "pointer",
    userSelect: "none",
  };
  const inputStyle = {
    position: "absolute",
    opacity: 0,
    width: 0,
    height: 0,
    margin: 0,
    pointerEvents: "none",
  };
  const ringStyle = {
    width: 16,
    height: 16,
    boxSizing: "border-box",
    border: "1.5px solid #000",
    borderRadius: "50%",
    background: "#fff",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const dotStyle = {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: checked ? "#000" : "transparent",
    transform: checked ? "scale(1)" : "scale(0.1)",
    transition:
      "transform 120ms ease-in-out, background 120ms ease-in-out",
  };

  return (
    <label style={labelStyle}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={onChange}
        style={inputStyle}
      />
      <span style={ringStyle}>
        <span style={dotStyle} />
      </span>
      <span style={{ fontSize: 14, color: "#000" }}>{label}</span>
    </label>
  );
};


const TrackOrderPage = () => {
  const [formData, setFormData] = useState({
    orderNumber: "",
    email: "",
    phone: "9479366330", // still here for API if needed
  });

  const [searchBy, setSearchBy] = useState("orderId"); // "orderId" | "awb"
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errorMsg) setErrorMsg("");
  };

  const {
    data: orderDetails,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: [
      LOCAL_KEYS.ordersDetails + "track",
      { searchBy, value: formData?.orderNumber },
    ],
    queryFn: async ({ queryKey }) => {
      const [_, { searchBy, value }] = queryKey;
      if (!value) return null;

      const payload = {};
      if (searchBy === "orderId") {
        payload.orderId = value;
      } else if (searchBy === "awb") {
        payload.awbNumber = value;
      }
      return await track_order(payload);
    },
    enabled: false,
    retry: 0,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!formData?.orderNumber) {
      return toast.error(
        `Please enter your ${searchBy === "orderId" ? "Order ID" : "AWB number"}`
      );
    }

    try {
      const { data, error } = await refetch();

      // React Query refetch doesn't throw by default if queryFn throws, 
      // but "error" property will be set if we used proper setup. 
      // However, refetch() returns { data, isError, error, ... } 
      // Note: refetch() promise resolves to the query result.

      // If the queryFn throws, refetch() result will have error.
      if (error) {
        throw error;
      }

      if (data?.trackingLink) {
        window.open(data.trackingLink, "_blank");
      }
    } catch (err) {
      // "err" here might be the error thrown from sfccOrders.js
      if ( err?.title || err?.detail ) {
        setErrorMsg( err.title || err.detail );
      } else {
        // Fallback or generic error
        // toast.error("Something went wrong. Try again.");
        // console.error("Tracking Error:", err);
      }
    }
  };

  return (
    <Box>
      <LogoNavbar />
      <CartQuickView />

      <Flex
        minH="100vh"
        direction="column"
        justify="center"
        align="center"
        py={10}
        px={4}
      >
        <Box textAlign="center" w="full" maxW="md">
          <Heading
            fontWeight="black"
            fontSize={{ base: "2xl", md: "4xl" }}
            mb={2}
            fontFamily="Roboto, sans-serif"
          >
            TRACK YOUR ORDER
          </Heading>

          <Text mb={6} fontSize={{ base: "sm", md: "md" }} color={"blackAlpha.700"}>
            Enter your order details
          </Text>

          {/* SEARCH BY : ORDER ID / AWB */}
          <Flex align="center" justify="center" gap={4} mb={4}>
            {/* LEFT LABEL */}
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.1em"
            >
              SEARCH BY :
            </Text>

            {/* CUSTOM BLACK/WHITE RADIOS */}
            <HStack spacing={6}>
              <RadioBW
                name="searchBy"
                value="orderId"
                checked={searchBy === "orderId"}
                onChange={() => setSearchBy("orderId")}
                label="ORDER ID"
              />
              <RadioBW
                name="searchBy"
                value="awb"
                checked={searchBy === "awb"}
                onChange={() => setSearchBy("awb")}
                label="AWB"
              />
            </HStack>
          </Flex>

          <Box mx="auto" w="full" maxW="400px">
            {/* Order / AWB Number input */}
            <FormControl mb={3}>
              <VisuallyHidden as="label" htmlFor="orderNumber">
                {searchBy === "orderId" ? "Order Number" : "AWB Number"}
              </VisuallyHidden>
              <InputGroup>
                <Input
                  id="orderNumber"
                  name="orderNumber"
                  type="text"
                  maxLength={50}
                  value={formData.orderNumber}
                  onChange={handleChange}
                  placeholder={
                    searchBy === "orderId"
                      ? "Order Number"
                      : "AWB Number"
                  }
                  fontSize={{ base: "xs", md: "sm" }}
                  border="1px solid"
                  borderColor={errorMsg ? "red.500" : "blackAlpha.600"}
                  borderRadius="0"
                  py={6}
                  _placeholder={{ color: "blackAlpha.600" }}
                  _focus={{
                    boxShadow: "none",
                    outline: "none",
                    borderColor: errorMsg ? "red.500" : "blackAlpha.600",
                  }}
                  _focusVisible={{
                    boxShadow: "none",
                    outline: "none",
                    borderColor: errorMsg ? "red.500" : "blackAlpha.600",
                  }}
                  _hover={{
                    borderColor: errorMsg ? "red.500" : "blackAlpha.600",
                    boxShadow: "none",
                  }}
                  isRequired
                />
              </InputGroup>
              {errorMsg && (
                <Text color="red.500" fontSize="xs" mt={1}>
                  {errorMsg}
                </Text>
              )}
            </FormControl>

            {/* Submit Button */}
            <LoadingButton
              text="FIND YOUR ORDER"
              isLoading={isFetching}
              onClick={handleSubmit}
              className="uppercase"
              borderRadius="0"
              style={{ width: "100%" }}
            />
          </Box>
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
};

export default TrackOrderPage;
