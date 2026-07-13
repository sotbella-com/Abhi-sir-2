import { Fragment, useState, useEffect } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";
import img1 from "@/assets/images/left-arrow.png";
import img2 from "@/assets/images/email-icon.png";
import orderConfirmed from "@/assets/images/orderConfirmed-icon.png";
import Processed from "@/assets/images/Processed-icon.png";
import Dispatched from "@/assets/images/Dispatched-icon.png";
import Delivered from "@/assets/images/Delivered-icon.png";
import { ShimmerTrackOrder } from "@/components/layouts";
import axios from "axios";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
// import { get_orders_details } from "@/api/services/sfccOrders";
import { useQuery } from "@tanstack/react-query";
import { IMAGE_URL } from "@/constants/constants";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import {
  Box,
  Flex,
  Grid,
  Image,
  Text,
  Heading,
  Link as ChakraLink,
  Divider,
} from "@chakra-ui/react";

const TrackOrder = () => {
  const [deliveryShipping, setDeliveryShipping] = useState([]);
  const [trackingNo, setTrackingNo] = useState("");
  const navigate = useNavigate();
  const { id } = useParams();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const { data: ssss, isFetching } = useQuery({
    queryKey: [LOCAL_KEYS.ordersDetails, { orderId: id }],
    // queryFn: get_orders_details,
    enabled: !!id,
    refetchOnWindowFocus: false,
  });

  const orderDetails = ssss?.data?.order || {};

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getShippingDetails = async () => {
    try {
      const response = await axios.post(
        `https://pre-alpha.ithinklogistics.com/api_v3/order/track.json`,
        {
          data: {
            awb_number_list: trackingNo,
            access_token: "5a7b40197cd919337501dd6e9a3aad9a",
            secret_key: "2b54c373427be180d1899400eeb21aab",
          },
        },
        {
          "Content-Type": "application/json",
          Cookie: "PHPSESSID=3eb3dbf348c512e0500bba5e847499d7",
        }
      );
      setDeliveryShipping(
        response?.data?.data?.["901234567109"]?.scan_details || []
      );
    } catch (error) {
    }
  };

  useEffect(() => {
    if (trackingNo) getShippingDetails();
  }, [trackingNo]);

  useEffect(() => {
    const tn = orderDetails?.trackingNo;
    if (tn) setTrackingNo(tn);
  }, [orderDetails]);

  const handleBack = (oid) => navigate(`/ordersummary/${oid}`);

  const steps = [
    { label: "Order Confirmed", img: orderConfirmed, status: "CONFIRMED" },
    { label: "Processed", img: Processed, status: "FULLFILLED" },
    { label: "Dispatched", img: Dispatched, status: "DISPATCHED" },
    { label: "Delivered", img: Delivered, status: "DELIVERED" },
  ];

  const subtotalBase =
    (orderDetails?.mrp || 0) -
    (orderDetails?.couponAmount || 0) +
    (orderDetails?.shippingCharge || 0);

  const vat = (subtotalBase * 0.05) || 0;
  const grand = subtotalBase + vat;

  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView />

      {isFetching ? (
        <ShimmerTrackOrder isMobile={isMobile} />
      ) : (
        <Box
          w="full"
          textAlign="left"
          mt={isMobile ? "20%" : "10%"}
          px={isMobile ? "12px" : "75px"}
        >
          <Box w="full">
            {/* Header Row */}
            <Flex
              w="full"
              mb={{ base: 4, md: 6 }}
              mt={3}
              align="center"
              justify="space-between"
            >
              <Flex
                as="h5"
                fontSize="xl"
                fontWeight="medium"
                letterSpacing="normal"
                mb={0}
                align="center"
                textTransform="uppercase"
              >
                <Image
                  src={img1}
                  alt="back"
                  w="20px"
                  mr={4}
                  cursor="pointer"
                  onClick={() => handleBack(orderDetails?.id)}
                />
                Order Id : {orderDetails?.id}
              </Flex>

              <Box display={{ base: "none", md: "block" }}>
                <ChakraLink
                  as={RouterLink}
                  to="/contactus"
                  color="white"
                  fontSize="sm"
                  textTransform="uppercase"
                  bg="black"
                  display="flex"
                  alignItems="center"
                  py={3}
                  px={6}
                  _hover={{ textDecoration: "none", bg: "black" }}
                >
                  <Image src={img2} alt="Customer Service" mr={1} />
                  Customer service
                </ChakraLink>
              </Box>
            </Flex>

            <Flex
              w="full"
              my={3}
              justify="space-between"
              direction={{ base: "column", md: "row" }}
              gapY={4}
              columnGap={0}
              rowGap={4}
            >
              {/* Order Summary (left) */}
              <Box
                border="1px solid"
                borderColor="blackAlpha.400"
                w={{ base: "100%", md: "65%" }}
                p={4}
              >
                <Flex
                  as="h6"
                  textTransform="uppercase"
                  fontSize="18px"
                  fontWeight="medium"
                  color="black"
                  align="center"
                  gap={2}
                >
                  Delivery Method:
                  <Text as="span" fontWeight="normal" ml={1}>
                    {orderDetails?.shippingMethod} Delivery
                  </Text>
                </Flex>

                {/* Status grid */}
                <Grid
                  templateColumns={{ base: "repeat(2,1fr)", lg: "repeat(4,1fr)" }}
                  gap={4}
                  mt={4}
                >
                  {steps.map((step, idx) => {
                    const isActive =
                      orderDetails?.subOrders?.[0]?.status === step.status;
                    return (
                      <Flex
                        key={idx}
                        p={2}
                        border="1px solid"
                        borderColor={isActive ? "black" : "neutral.400"}
                        bg={isActive ? "black" : "white"}
                        color={isActive ? "white" : "black"}
                        align="flex-start"
                      >
                        <Image
                          src={step.img}
                          h="40px"
                          p={1}
                          border="1px solid"
                          borderColor={isActive ? "gray.300" : "neutral.400"}
                          bg={isActive ? "gray.100" : "transparent"}
                        />
                        <Flex direction="column" justify="space-between" ml={2} fontSize="xs" fontWeight="light">
                          <Text fontWeight="medium">
                            {step.label}
                          </Text>
                          <Text mt={2} opacity={isActive ? 0.8 : 0.6}>
                            {step.label}
                          </Text>
                        </Flex>
                      </Flex>
                    );
                  })}
                </Grid>

                {/* Address */}
                <Box w="full" borderTop="1px solid" borderColor="blackAlpha.300" mt={5} pt={5}>
                  <Flex wrap="wrap">
                    <Box
                      w="full"
                      mt={{ base: 5, md: 0 }}
                      borderTop={{ base: "1px solid", md: "none" }}
                      borderColor={{ base: "blackAlpha.300", md: "transparent" }}
                      pt={{ base: 5, md: 0 }}
                    >
                      <Heading as="h4" fontSize="18px" fontWeight="medium" textTransform="uppercase" mb={2}>
                        Shipping address
                      </Heading>
                      <Text fontSize="14px" fontWeight="medium">
                        {orderDetails?.firstName} {orderDetails?.lastName} ({orderDetails?.phone})
                      </Text>
                      <Text fontSize="14px" mt={1} color="#666" lineHeight="tall">
                        {orderDetails?.address},
                        <br />
                        {`${orderDetails?.city?.name ?? ""}, ${orderDetails?.state?.name ?? ""}, ${orderDetails?.country?.name ?? ""},`}
                        <br /> {orderDetails?.pincode}
                      </Text>
                    </Box>
                  </Flex>
                </Box>

                {/* Items */}
                <Box w="full" borderTop="1px solid" borderColor="blackAlpha.300" mt={5} pt={5}>
                  <Flex direction="column">
                    <Heading as="h4" fontSize="18px" fontWeight="medium" textTransform="uppercase" mb={4}>
                      Order Items
                    </Heading>

                    {Array.isArray(orderDetails?.subOrders) &&
                      orderDetails?.subOrders?.length > 0 &&
                      orderDetails?.subOrders?.map((sub, index) => (
                        <Flex key={index} mb={4}>
                          <Box w="80px" minW="80px" mr={5}>
                            {sub?.product?.productImages?.[0]?.image ? (
                              <Image
                                src={`${sub?.product?.productImages[0]?.image}`}
                                w="100%"
                                h="auto"
                                objectFit="cover"
                                alt={sub?.product?.title || "Product"}
                              />
                            ) : (
                              <Text>No Image Available</Text>
                            )}
                          </Box>
                          <Flex flex="1" direction="column">
                            <Flex justify="space-between" align="flex-start" mb={1}>
                              <Text fontSize="16px" fontWeight="medium">
                                {sub?.product?.title || "No Title"}
                              </Text>
                              <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">
                                {CURRENCY_SYMBOL}{sub?.product?.price?.toFixed(2) || "0.00"}
                              </Text>
                            </Flex>
                            <Text textTransform="uppercase" fontSize="14px" color="#1d1d1d" mb={2}>
                              <Text as="span" color="#1d1d1d80">Qty:</Text> {sub?.quantity || 0} {" | "}
                              <Text as="span" color="#1d1d1d80">Size:</Text> {sub?.product?.size?.name || "N/A"}
                            </Text>
                          </Flex>
                        </Flex>
                      ))}
                  </Flex>
                </Box>

                {/* Order Summary */}
                <Box w="full" borderTop="1px solid" borderColor="blackAlpha.300" mt={5} pt={5}>
                  <Box w="full">
                    <Heading as="h4" fontSize="18px" fontWeight="medium" textTransform="uppercase" mb={4}>
                      Order Summary
                    </Heading>

                    <Box p={4} border="1px solid" borderColor="#888">
                      <Box mb={4}>
                        <Text textTransform="uppercase" fontSize="14px" mb={3}>
                          Order Summary
                        </Text>

                        <Flex justify="space-between" fontSize="xs" mb={2}>
                          <Text>MRP</Text>
                          <Text>
                            {CURRENCY_SYMBOL} {orderDetails?.mrp?.toFixed(2)}
                          </Text>
                        </Flex>

                        {!!orderDetails?.couponAmount && (
                          <Flex justify="space-between" fontSize="xs" mb={2}>
                            <Text>Coupon Discount</Text>
                            <Text>
                              - {CURRENCY_SYMBOL} {orderDetails?.couponAmount?.toFixed(2) || "0.00"}
                            </Text>
                          </Flex>
                        )}

                        <Flex justify="space-between" fontSize="xs" mb={2}>
                          <Text>
                            Shipping(
                            <Text as="span" fontSize="10px" color="blackAlpha.700" textTransform="uppercase">
                              {orderDetails?.shippingMethod?.toLowerCase()}
                            </Text>
                            )
                          </Text>
                          <Text>
                            {orderDetails?.shippingCharge
                              ? `${CURRENCY_SYMBOL} ${orderDetails?.shippingCharge?.toFixed(2)}`
                              : "FREE"}
                          </Text>
                        </Flex>

                        <Flex justify="space-between" fontSize="xs" mb={2}>
                          <Text>Tax (5%)</Text>
                          <Text>
                            {CURRENCY_SYMBOL} {(vat)?.toFixed(2) || "0.00"}
                          </Text>
                        </Flex>

                        {!!orderDetails?.wallet && (
                          <Flex justify="space-between" fontSize="xs" mb={2}>
                            <Text>Wallet</Text>
                            <Text>
                              - {CURRENCY_SYMBOL} {orderDetails?.wallet?.toFixed(2) || "0.00"}
                            </Text>
                          </Flex>
                        )}
                      </Box>

                      <Divider borderColor="gray.400" />

                      <Flex justify="space-between" pt={3}>
                        <Text fontWeight="semibold" fontSize="base">Grand Total</Text>
                        <Text fontWeight="semibold" fontSize="base">
                          {CURRENCY_SYMBOL} {(grand)?.toFixed(2)}
                        </Text>
                      </Flex>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Package Tracking (right) */}
              <Box
                w={{ base: "100%", md: "35%" }}
                border="1px solid"
                borderColor="blackAlpha.400"
                p={4}
              >
                <Heading as="h6" textTransform="uppercase" fontSize="18px" fontWeight="medium" color="black" mb={4}>
                  Package Tracking
                </Heading>

                <Box w="full" mt={4}>
                  {trackingNo ? (
                    (deliveryShipping?.slice().reverse() || []).map((item, index) => (
                      <Flex key={index} align="flex-start" gap={3} mb={4}>
                        <Box w="20px" h="20px" bg="black" rounded="full" flexShrink={0} mt={1} />
                        <Box fontSize="sm">
                          <Text fontWeight="semibold">{item?.status}</Text>
                          <Text color="gray.600">{item?.remark}</Text>
                          <Text fontSize="xs" color="gray.500">{item?.scan_date_time}</Text>
                        </Box>
                      </Flex>
                    ))
                  ) : (
                    <Text fontSize="sm" color="gray.700">
                      Item is not yet dispatched
                    </Text>
                  )}
                </Box>
              </Box>
            </Flex>
          </Box>
        </Box>
      )}
      <Footer />
    </Fragment>
  );
};

export default TrackOrder;
