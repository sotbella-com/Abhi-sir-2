import { useState } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { LoadingButton } from "@/components/atoms";
import { handleNavigate } from "@/utils/url";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-toastify";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import {
  Box,
  Flex,
  Heading,
  Text,
  FormControl,
  InputGroup,
  Input,
  VisuallyHidden,
} from "@chakra-ui/react";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
// import { getSiteConfig } from "@/utils/sfccSiteConfig";
import Footer from "@/NewHomePage/components/footer/Footer";

import { get_order_details } from "@/api/services/sfccOrders";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useReturnExchangeStore } from "@/context/returnExchangeStore";

// ✅ zustand store (persist)
// import { useReturnExchangeStore } from "@/store/returnExchangeStore";

const ReturnExchangePage = () => {

  const [formData, setFormData] = useState({
    orderNumber: "",
    phone: ("91").replace("+"),
  });

  const [loading, setLoading] = useState(false);
  const [orderError, setOrderError] = useState("");

  // ✅ zustand action
  const setOrder = useReturnExchangeStore((s) => s.setOrder);

  const { mutate: fetchOrder, isPending } = useMutation({
    mutationFn: async ({ orderId }) => {
      return get_order_details({
        queryKey: [LOCAL_KEYS.ordersDetailsForReturn, { orderId }],
      });
    },

    onSuccess: (res) => {
      const order = res?.data?.order;

      if (order?.id) {
        setOrder(order);
        setOrderError("");
        handleNavigate(`/returnexchange/${formData?.orderNumber}`, "_self");
      } else {
        setOrderError(res?.title || "Order Not Found");
      }
    },

    onError: (error) => {
      console.log("Order API Error:", error);

      setOrderError(
        error?.title ||
        error?.response?.data?.title ||
        error?.data?.title ||
        "Order Not Found"
      );
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhoneChange = (value) => {
    setFormData((prev) => ({ ...prev, phone: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (formData?.orderNumber) {
        fetchOrder({ orderId: formData.orderNumber });
      } else {
        // toast.error("Please fill all the required fields");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box w="full">
      <LogoNavbar />
      <CartQuickView />

      <Flex
        minH="100vh"
        direction="column"
        align="center"
        justify="center"
        px={4}
        py={20}
      >
        <Box w="full" maxW="2xl" textAlign="center">
          <Heading
            fontWeight="black"
            fontSize={{ base: "2xl", md: "4xl" }}
            mb={2}
            fontFamily="Roboto, sans-serif"
          >
            RETURN & EXCHANGE
          </Heading>

          <Text mb={6} fontSize={{ base: "sm", md: "md" }} color="blackAlpha.700">
            Enter your order number to check your order status.
          </Text>

          <Box as="form" onSubmit={handleSubmit} mx="auto" mt={6} w="full" maxW="md">
            <Flex direction="column" gap={4}>
              <FormControl>
                <VisuallyHidden as="label" htmlFor="orderNumber">
                  Order Number
                </VisuallyHidden>
                <InputGroup>
                  <Input
                    id="orderNumber"
                    name="orderNumber"
                    type="text"
                    maxLength={50}
                    value={formData.orderNumber}
                    onChange={handleChange}
                    placeholder="Order Number"
                    fontSize={{ base: "sm", md: "md" }}
                    border="1px solid"
                    borderColor={orderError ? "red.500" : "blackAlpha.600"}
                    borderRadius="0"
                    py={6}
                    _placeholder={{ color: "blackAlpha.600" }}
                    _focus={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "blackAlpha.600",
                    }}
                    _focusVisible={{
                      boxShadow: "none",
                      outline: "none",
                      borderColor: "blackAlpha.600",
                    }}
                    _hover={{
                      borderColor: "blackAlpha.600",
                      boxShadow: "none",
                    }}
                    isRequired
                  />
                </InputGroup>
                {orderError ? (
                <Text
                  color="red.500"
                  fontSize="xs"
                  mt={1}
                >
                  {orderError}
                </Text>
              ) : null}
              </FormControl>

              {/* <FormControl>
                <VisuallyHidden as="label" htmlFor="phone">
                  Phone
                </VisuallyHidden>
                <Box border="1px solid" borderColor="blackAlpha.600" borderRadius="0" h="auto">
                  <PhoneInput
                    country={iso2 || "in"}
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    inputStyle={{
                      width: "100%",
                      border: "none",
                      borderRadius: 0,
                      height: "48px",
                      fontSize: "14px",
                    }}
                    buttonStyle={{
                      border: "none",
                      borderRadius: 0,
                    }}
                    containerStyle={{
                      width: "100%",
                    }}
                    dropdownStyle={{
                      zIndex: 9999,
                    }}
                  />
                </Box>
              </FormControl> */}

              <Box pt={1}>
                <LoadingButton
                  text="FIND YOUR ORDER"
                  isLoading={loading || isPending}
                  type="submit"
                  borderRadius="0"
                  style={{ width: "100%" }}
                />
              </Box>
            </Flex>
          </Box>
        </Box>
      </Flex>
      <Footer />
    </Box>
  );
};

export default ReturnExchangePage;
