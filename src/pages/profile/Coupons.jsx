import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { get_active_promotions } from "@/api/services/sfccCoupons";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { ProfileSideBar } from "@/components/layouts";
import leftArrow from "@/assets/images/left-arrow.png";
import { useMobile } from "@/components/molecules";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import emptyicon from "../../assets/images/empty.png";
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Image,
  Link,
} from "@chakra-ui/react";
import Footer from "@/NewHomePage/components/footer/Footer";
import Lottie from "lottie-react";
import { NoDataAnimation } from "@/assets/animation";
import { set } from "lodash";
import CouponShimmer from "@/components/layouts/Simmers/CouponShimmer";

/* ---------- STATE HOOK FOR COUPONS ---------- */
const Coupons = () => {
  const isMobile = useMobile();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [copiedIndex, setCopiedIndex] = useState(-1);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch coupons when the component mounts
  useEffect(() => {
    const fetchCoupons = async () => {
      if (!user?.customerId) return;

      setLoading(true);

      try {
        const { promotions, customerPromotions } = await get_active_promotions({
          locale: import.meta.env.VITE_SFCC_LOCALE,
        });

        // Combine customer and regular promotions if needed
        // Combine customer and regular promotions if needed
        // const allCoupons = [...promotions, ...customerPromotions];
        const allCoupons = [...customerPromotions];

        // Filter out promotions where coupons array is empty and name is not "marketing"
        const filteredCoupons = allCoupons.filter((promo) => {
          return (
            Array.isArray(promo.coupons) &&
            promo.coupons.length > 0 &&
            promo.name.toLowerCase() !== "marketing"
          );
        });

        // Flatten out coupons from promotions (this will give an array of coupon codes)
        setCoupons(filteredCoupons);
      } catch (error) {
        // console.error("Failed to fetch coupons:", error);
        // toast.error("Failed to load coupons.");
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [user?.id]);

  const handleBack = () => navigate(-1);

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
            Coupons
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 12, md: 10 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"COUPON"} />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Mobile top bar */}
            <Flex
              w="full"
              mb={{ base: 2, md: 4 }}
              display={{ base: "flex", md: "none" }}
              justify="space-between"
              align="center"
              mt={isMobile ? 4 : "70px"}
            >
              <Flex
                onClick={handleBack}
                align="center"
                fontWeight="medium"
                fontSize="15px"
                color="black"
                cursor="pointer"
              >
                <Image src={leftArrow} w="16px" mr={5} alt="Back" />
                <Text textTransform="uppercase">Coupons</Text>
              </Flex>
            </Flex>

            {loading ? (
              <Box border="1px solid" borderColor="blackAlpha.500" p={4}>
                <CouponShimmer />
              </Box>
            ) : (
              <Box border="1px solid" borderColor="blackAlpha.500" p={4}>
                {coupons.length > 0 ? (
                  <Box maxH="400px" overflowY="auto" className="scroll-thin" pr={2}>
                    {coupons.map((coupon, index) => (
                      <Flex
                        key={index}
                        justify="space-between"
                        align="center"
                        border="1px dashed"
                        borderColor="blackAlpha.600"
                        gap={1}
                        px={4}
                        py={2}
                        mb={4}
                        _last={{ mb: 0 }}
                      >
                        {/* Left text */}
                        <Box>
                          <Text fontSize={{ base: "sm", md: "base" }} fontWeight="semibold" color="black">
                            {coupon.name}
                          </Text>
                          <Text fontSize={{ base: "11px", md: "xs" }} color="blackAlpha.600" mt={0.5}>
                            {coupon.details || (coupon.callout ? coupon.callout.replace(/<[^>]+>/g, "") : "")}
                          </Text>
                        </Box>

                        {/* Right coupon pill */}
                        <Button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.coupons[0]);
                            setCopiedIndex(index); // set copied index

                            // Reset after 2 seconds
                            setTimeout(() => setCopiedIndex(-1), 2000);
                          }}
                          variant="outline"
                          borderColor="black"
                          borderRadius={0}
                          color="black"
                          fontSize={{ base: "11px", md: "xs" }}
                          fontWeight="semibold"
                          display="inline-flex"
                          alignItems="center"
                          py={0}
                          gap={1}
                          h={8}
                          _hover={{
                            bg: "transparent",
                          }}
                        >
                          <Box as="span" display="flex">
                            {copiedIndex === index ? (
                              /* ✅ ICON AFTER COPIED */
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="#16A34A"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <circle cx="12" cy="12" r="12" />
                                <path
                                  d="M7 12.5L10.5 16L17 9"
                                  stroke="white"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            ) : (
                              /* 📄 DEFAULT COPY ICON */
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M6 10C6 8.1144 6 7.1716 6.58579 6.58579C7.1716 6 8.1144 6 10 6H10.6667C12.5523 6 13.4951 6 14.0809 6.58579C14.6667 7.1716 14.6667 8.1144 14.6667 10V10.6667C14.6667 12.5523 14.6667 13.4951 14.0809 14.0809C13.4951 14.6667 12.5523 14.6667 10.6667 14.6667H10C8.1144 14.6667 7.1716 14.6667 6.58579 14.0809C6 13.4951 6 12.5523 6 10.6667V10Z"
                                  stroke="black"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M11.332 5.99967C11.3304 4.02828 11.3006 3.00715 10.7267 2.30796C10.6159 2.17293 10.4921 2.04913 10.3571 1.93831C9.6195 1.33301 8.5237 1.33301 6.33203 1.33301C4.14038 1.33301 3.04455 1.33301 2.30698 1.93831C2.17196 2.04912 2.04815 2.17293 1.93734 2.30796C1.33203 3.04553 1.33203 4.14135 1.33203 6.33301C1.33203 8.52467 1.33203 9.62047 1.93734 10.3581C2.04814 10.4931 2.17196 10.6169 2.30698 10.7277C3.00617 11.3015 4.0273 11.3313 5.9987 11.3329"
                                  stroke="black"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            )}
                          </Box>
                          <Text as="span">
                            {copiedIndex === index ? "Copied!" : coupon.coupons[0]}
                          </Text>
                        </Button>
                      </Flex>
                    ))}
                  </Box>
                ) : (
                  /* API EMPTY STATE */
                  <Box textAlign="center">
                    <Box w={{ base: "50%", md: "250px" }} mx="auto">
                      <Image src={emptyicon} alt="Empty" />
                    </Box>
                    <Box my={4}>
                      <Heading as="h4" fontSize="lg" fontWeight="semibold">
                        Hey, it’s looks empty!
                      </Heading>
                      <Text fontSize="xs">
                        No coupons available! Shop Now to get coupons
                      </Text>
                      <Link
                        as={RouterLink}
                        to="/category/new-in"
                        display="inline-block"
                        bg="black"
                        color="white"
                        fontSize="sm"
                        py={2}
                        px={5}
                        textTransform="uppercase"
                        mt={4}
                      >
                        Shop Now
                      </Link>
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Flex>
      </Box>

      <Footer />
    </Fragment>
  );
};

export default Coupons;
