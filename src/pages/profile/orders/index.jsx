import { Fragment, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ProfileSideBar } from "@/components/layouts";
import leftArrow from "@/assets/images/left-arrow.png";
import { useQuery } from "@tanstack/react-query";
import { LOCAL_KEYS } from "@/constants/localStorageKeys";
import { useAuth } from "@/context/AuthContext";
import { Tag } from "antd";
import { ShimmerOrdersTable } from "@/components/layouts/Simmers/ShimmerOrdersTable";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import CustomSelect from "./CustomSelect";
import emptyicon from "../../../assets/images/empty.png";

import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
} from "@chakra-ui/react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";
import { get_orders_listing } from "@/api/services";
import { getFrontendPreferences } from "@/api/services/sfccPreferences";

import { CURRENCY_SYMBOL } from "@/constants/constants";
import { ChevronRight } from "lucide-react";

// 🔹 Get currency from each order dynamically 
const getOrderCurrency = (order) => {
  return (
    CURRENCY_SYMBOL
  );
};

// 🔹 Mobile Order Card Component
const MobileOrderCard = ({ order, item, formattedDate, handleOrderSummary }) => {
  const navigate = useNavigate();
  // Extract attributes
  const attributes = item?.variationAttributes || [];
  const colorAttr = attributes.find(attr => attr.id === "color");
  const sizeAttr = attributes.find(attr => attr.id === "size");
  const materialAttr = attributes.find(attr => attr.id === "material");

  const color = colorAttr?.values?.find(v => v.selected)?.displayValue || colorAttr?.displayValue || "";
  const size = sizeAttr?.values?.find(v => v.selected)?.displayValue || sizeAttr?.displayValue || "";
  const material = materialAttr?.values?.find(v => v.selected)?.displayValue || materialAttr?.displayValue || "";
  // Image logic
  const productImage = item?.c_images?.large?.[0]?.absURL ||
    item?._raw?.c_images?.large?.[0]?.url ||
    item?._raw?.c_images?.large?.[0]?.absURL ||
    emptyicon;
  // const productImage = item?.product?.productImages?.[0]?.image ||
  //   item?.c_images?.large?.[0]?.url ||
  //   item?.c_images?.large?.[0]?.absURL ||
  //   emptyicon;

  const paymentStatus = (order?.paymentStatus || "UNPAID").toUpperCase();
  const isPaid = paymentStatus === "PAID";

  const handleProductClick = (e) => {
    e.stopPropagation();
    if (item?.productId) {
      navigate(`/product/${item.productId}`);
    }
  };

  return (
    <Box
      bg="white"
      mb={3}
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.200"
      onClick={() => handleOrderSummary(order.id)}
    >
      {/* Header */}
      <Flex justify="space-between" align="center" p={3} borderBottom="1px solid" borderColor="gray.100">
        <Text fontWeight="bold" fontSize="xs">
          ORDER NO #{order.id}
        </Text>
        <Text fontWeight="bold" fontSize="xs">
          {order.status}
        </Text>
      </Flex>

      {/* Sub-Header */}
      <Flex justify="space-between" align="center" px={3} py={2}>
        <Text fontSize="xs" color="gray.500">
          {item.quantity} ITEM ({isPaid ? "PAID" : "UNPAID"})
        </Text>
        <Text fontSize="xs" color="gray.500">
          {formattedDate(order.createdAt)}
        </Text>
      </Flex>

      {/* Body */}
      <Flex p={3} gap={4} align="center">
        {/* Product Image */}
        <Box
          w="80px"
          h="100px"
          bg="gray.100"
          flexShrink={0}
          onClick={handleProductClick}
          cursor="pointer"
        >
          <Image
            src={productImage}
            alt={item.productName}
            w="full"
            h="full"
            objectFit="cover"
            fallbackSrc={emptyicon}
          />
        </Box>

        {/* Details */}
        <Box flex="1">
          <Text
            fontSize="xs"
            fontWeight="semibold"
            noOfLines={2}
            mb={1}
            onClick={handleProductClick}
            cursor="pointer"
          >
            {item.productName}
          </Text>
          <Text fontSize="xs" color="black" fontWeight="medium" mb={1}>
            QTY: {item.quantity} {color && `| ${color}`} {size && `| ${size}`}
          </Text>
          {material && (
            <Text fontSize="xs" color="black">
              Material : {material}
            </Text>
          )}
        </Box>

        {/* Arrow Icon */}
        <Box>
          <ChevronRight size={20} />
        </Box>
      </Flex>
    </Box>
  );
};

const Order = () => {
  const isMobile = useMobile();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [orderStatusOptions, setOrderStatusOptions] = useState([]);
  const [statusCodeToLabel, setStatusCodeToLabel] = useState({});
  const { user } = useAuth();


  // Fetch the frontend preferences including order statuses
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        const data = await getFrontendPreferences();
        const orderStatus = data?.orderStatus || {};


        const reverse = {};
        Object.entries(orderStatus).forEach(([label, code]) => {
          if (code !== undefined && code !== null) {
            reverse[String(code).toUpperCase()] = label;
          }
        });
        setStatusCodeToLabel(reverse);

        const statusOptions = [
          { value: "ALL", label: "ALL" },
          ...Object.keys(orderStatus).map((key) => ({
            value: key,
            label: key,
          })),
        ];

        setOrderStatusOptions(statusOptions);
      } catch (error) {
        // console.error("Failed to fetch preferences", error);
      }
    };
    fetchPreferences();
  }, []);

  const { data, isFetching: isLoading, isError, error } = useQuery({
    queryFn: get_orders_listing,
    queryKey: [
      LOCAL_KEYS.orders,
      {
        cId: user?.id,
        page: 1,
        limit: 1000,
        status: filterStatus,
        failedOrders: false,
      },
    ],
    refetchOnWindowFocus: false,
    enabled: !!filterStatus, // Only enable when filterStatus is set
  });


  if (isError) {
  }

  const allOrders = data?.orders || [];

  // Exclude "pending/empty" payments; new API uses NOTPAID/PAID.
  const orders = allOrders.filter((o) => {
    const ps = (o?.paymentStatus || "").toUpperCase();
    return ps && ps !== "PENDING"; // allow PAID/NOTPAID; exclude literal "PENDING"
  });

  const handleOrderSummary = (id) => navigate(`/ordersummary/${id}`);
  const handleSelectStatus = (value) => setFilterStatus(value);
  const handleBack = () => navigate("/mobileacount");

  const formattedDate = (iso) => {
    if (!iso) return "-";
    const d = new Date(iso);
    const opts = { month: "short", day: "numeric", year: "numeric" };
    return d.toLocaleString("en-IN", opts).replace(" ", ", ");
  };

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
            My Account / Orders
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 12, md: 10 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"ORDER"} />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Mobile back/top bar */}
            <Flex
              w="full"
              mb={{ base: 2, md: 4 }}
              mt={{ base: isMobile ? 4 : "70px", md: 0 }}
              align="center"
              justify="space-between"
              display={{ base: "flex", md: "none" }}
            >
              <Text
                onClick={handleBack}
                fontWeight="normal"
                fontSize="15px"
                color="black"
                cursor="pointer"
                textTransform="uppercase"
              >
                <Box
                  as="img"
                  src={leftArrow}
                  alt="Back"
                  w="16px"
                  mr="5px"
                  display="inline-block"
                />{" "}
                Orders
              </Text>
            </Flex>

            {/* WRAPPER BOX FOR BORDER */}
            <Box border="1px solid" borderColor="blackAlpha.500" p={4}>
              {/* Filter */}
              {/* {!isLoading && orders.length > 0 && ( */}
              <Flex mb={3} align="center" gap={3}>
                <CustomSelect
                  options={orderStatusOptions} // Use the dynamic order status options here
                  value={filterStatus}
                  onChange={handleSelectStatus}
                />
              </Flex>
              {/* )} */}

              {isLoading ? (
                <ShimmerOrdersTable />
              ) : orders.length === 0 ? (
                // ✅ EMPTY STATE (no table, no border)
                <Box textAlign="center" py={0}>
                  <Box w={{ base: "50%", md: "250px" }} mx="auto">
                    <Image src={emptyicon} alt="Empty" />
                  </Box>

                  <Box my={4}>
                    <Heading as="h4" fontSize="lg" fontWeight="semibold">
                      Hey, it’s looks empty!
                    </Heading>
                    <Text fontSize="xs">
                      No orders yet. Browse our collection and get started today.
                    </Text>

                    <Button
                      as={Link}
                      to="/category/all dresses"
                      mt={4}
                      bg="black"
                      color="white"
                      fontSize="sm"
                      fontWeight="medium"
                      px={6}
                      py={3}
                      borderRadius={0}
                      textTransform="uppercase"
                      letterSpacing="wide"
                      _hover={{ bg: "#000" }}
                    >
                      Shop Now
                    </Button>

                  </Box>
                </Box>
              ) : (
                // ✅ TABLE ONLY WHEN ORDERS EXIST
                <Box>
                  {/* Mobile View: List of Cards */}
                  <Box display={{ base: "block", md: "none" }}>
                    {orders.map((order) => {
                      // Flatten subOrders to render one card per item
                      // If no subOrders, we might render a generic card (though data usually has subOrders)
                      const items = order.subOrders && order.subOrders.length > 0 ? order.subOrders : [];

                      if (items.length === 0) {
                        // Fallback if no items (should happen rarely based on data structure)
                        return (
                          <MobileOrderCard
                            key={order.id}
                            order={order}
                            item={{ quantity: 0, productName: "Order Details" }}
                            formattedDate={formattedDate}
                            handleOrderSummary={handleOrderSummary}
                          />
                        );
                      }

                      return items.map((item, idx) => (
                        <MobileOrderCard
                          key={`${order.id}-${idx}`}
                          order={order}
                          item={item}
                          formattedDate={formattedDate}
                          handleOrderSummary={handleOrderSummary}
                        />
                      ));
                    })}
                    {/* "No More Orders" text at bottom */}
                    {/* <Text textAlign="center" fontSize="xs" color="gray.500" mt={8} mb={4}>
                      No More Orders
                    </Text> */}
                  </Box>

                  {/* Desktop View: Table */}
                  <Box overflowX="auto" overflowY="auto" maxH="500px" className="scroll-thin" display={{ base: "none", md: "block" }}>
                    <Table variant="simple" size={{ base: "sm", md: "md" }} whiteSpace="nowrap">
                      <Thead>
                        <Tr>
                          <Th color="black" textTransform="none" textAlign="left" pl={0} fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Sr. No.
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Order ID
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Date
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Order Status
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Payment Method
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Payment Status
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Total
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Total items
                          </Th>
                          <Th color="black" textTransform="none" textAlign="center" fontSize={{ base: "xs", md: "sm" }} px={0.5}>
                            Actions
                          </Th>
                        </Tr>
                      </Thead>

                      <Tbody>
                        {orders.map((item, i) => (
                          <Tr
                            key={item?.id || i}
                            fontFamily="Lato, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial"
                            borderBottom="1px solid"
                            borderColor="blackAlpha.500"
                          >
                            <Td py={{ base: 2, md: 4 }} textAlign="left" pl={0} fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              #{i + 1}
                            </Td>
                            <Td
                              textAlign="center"
                              fontSize={{ base: "10px", md: "xs" }}
                              px={0.5}
                              color="blue.500"
                              cursor="pointer"
                              _hover={{ textDecoration: "underline" }}
                              onClick={() => handleOrderSummary(item?.id)}
                            >
                              {item?.id}
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              {formattedDate(item?.createdAt)}
                            </Td>
                            <Td
                              textAlign="center"
                              fontSize={{ base: "10px", md: "xs" }}
                              px={0.5}
                              fontWeight={(item?.status || "").toUpperCase() === "PROCESSING" ? "bold" : "normal"}
                              color={(item?.status || "").toLowerCase() === "cancelled" ? "red.500" : "black"}
                            >
                              {item?.status}
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              {(item?.paymentMethod || "").toLowerCase() === "stripe" ? "Online" : (item?.paymentMethod || "-")}
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              <Tag color={(item?.paymentStatus || "").toUpperCase() === "PAID" ? "green" : "red"}>
                                {(item?.paymentStatus || "UNPAID").toUpperCase()}
                              </Tag>
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              {getOrderCurrency(item)} {(Number(item?.grandTotal) || 0).toFixed(2)}
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} px={0.5}>
                              {Array.isArray(item?.subOrders) ? item.subOrders.length : 0}
                            </Td>
                            <Td textAlign="center" fontSize={{ base: "10px", md: "xs" }} p={0} px={0.5}>
                              <Button
                                onClick={() => handleOrderSummary(item?.id)}
                                bg="black"
                                border="1.5px solid"
                                borderColor="black"
                                color="white"
                                fontSize="xs"
                                fontWeight={400}
                                borderRadius={0}
                                px={3}
                                _hover={{ bg: "gray.800", borderColor: "gray.800" }}
                                h={6}
                              >
                                View
                              </Button>
                            </Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                </Box>
              )
              }
            </Box>

          </Box>
        </Flex>
      </Box>
      <Footer />
    </Fragment>
  );
};

export default Order;



