import { Fragment, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import leftArrow from "@/assets/images/left-arrow.png";
import { toast } from "react-toastify";
import { ProfileSideBar } from "@/components/layouts";
import { useAuth } from "@/context/AuthContext";
import ConfirmationModal from "@/components/compounds/confirmationModal";
import { PlusIcon } from "lucide-react";
import emptyicon from "../../assets/images/empty.png";
import { useMobile } from "@/components/molecules";
import CartQuickView from "../ProductDetails/components/cartQuickView";

import { Box, Flex, Heading, Text, Image, Link } from "@chakra-ui/react";
import Footer from "@/NewHomePage/components/footer/Footer";
import InsideNavbar from "@/components/layouts/InsideNavbar";

// ✅ SFCC
import { getCustomer, deleteCustomerAddress } from "@/api/services/sfccCustomers";
// ✅ token utils (for guard / ids if you need)
import { isUserLoggedIn, getCustomerId } from "@/utils/tokenUtils";
import ShimmerAddressList from "@/components/layouts/Simmers/ShimmerAddressList";
import LogoNavbar from "@/components/layouts/LogoNavbar";

const Acaddress = () => {
  const [showDeleteModal, setShowDeleteModal] = useState("");
  const [displayAddresses, setDisplayAddresses] = useState([]); // what your UI renders
  const [address, setAddress] = useState([]); // used by your empty state block
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
  const isLoggedIn = isUserLoggedIn();
  const isMobile = useMobile();

  // If you don't have these mutations wired yet, keep no-op fallbacks to avoid crashes
  const setDefaultAddressMutation = { mutate: () => { } };
  const deleteAddressMutation = { mutate: () => { } };
  const deleteAddress = async (addressId) => {
    try {
      await deleteCustomerAddress({ addressName: addressId });
      // toast.success("Address deleted.");
      // optimistically update UI
      setDisplayAddresses(prev => prev.filter(a => a.id !== addressId));
      setAddress(prev => prev.filter(a => a.id !== addressId));
    } catch (e) {
      // toast.error("Failed to delete address");
    } finally {
      setShowDeleteModal("");
    }
  };

  const handleBack = () => navigate(-1);

  // --- Fetch SFCC customer (and addresses)
  useEffect(() => {
    (async () => {
      try {
        setIsLoading(true);
        if (!isUserLoggedIn()) {
          // not logged in → show empty list, or navigate to login
          setDisplayAddresses([]);
          setAddress([]);
          return;
        }

        const customer = await getCustomer(); // GET /customers/{customerId}?siteId=...
        // customer.addresses is an array of SFCC addresses (addressId, address1, city, countryCode, etc.)

        const mapped = (customer?.addresses ?? []).map((a) => ({
          id: a.addressId,                           // used in your edit/remove links
          firstName: a.firstName ?? "",
          lastName: a.lastName ?? "",
          phone: a.phone ?? user?.phone ?? "",
          address: [a.address1, a.address2].filter(Boolean).join(", "),
          cityName: a.city ?? "",
          stateName: a.stateCode ?? "",
          countryName: a.countryCode ?? "",          // code shown as-is; map to label if you want
          isDefault:
            Boolean(a.c_isDefault) || customer?.preferredAddressId === a.addressId,
        }));

        // Sort so default address always on top
        const sorted = mapped.sort((a, b) => {
          if (a.isDefault && !b.isDefault) return -1;
          if (!a.isDefault && b.isDefault) return 1;
          return 0;
        });


        setDisplayAddresses(sorted);
        setAddress(sorted);
      } catch (e) {
        // toast.error("Failed to load addresses");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user?.id]);

  return (
    <Fragment>
      {isLoading ? (
        <>
          {/* <InsideNavbar /> */}
           <LogoNavbar />
          <CartQuickView />
          <ShimmerAddressList />
          <Footer />
        </>
      ) : (
        <>
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
                textTransform={"uppercase"}
              > 
                My Account / Address
              </Heading>
            </Box>
          </Box>

          <Box pb={5} pt={{ base: 2, md: 10 }} px={{ base: "12px", md: "50px" }}>
            <Flex wrap="wrap" justify="space-between" gap={4}>
              <ProfileSideBar activeTab={"ADDRESS"} />

              {/* Right column */}
              <Box
                w={{ base: "100%", lg: "66.666%" }}
                overflowY={{ lg: "auto" }}
                maxH={{ base: "none", lg: "500px" }}
                className="scroll-thin"
              >
                {/* Mobile top bar */}
                <Flex
                  w="full"
                  mt={{ base: 14, lg: 0 }}
                  align="center"
                  justify="space-between"
                  display={{ base: "flex", lg: "none" }}
                  position="sticky"
                  top="56px"
                  zIndex={2}
                  bg="white"
                  py={2}
                >
                  <Flex
                    as="button"
                    onClick={handleBack}
                    color="black"
                    fontSize="15px"
                    fontWeight="medium"
                    align="center"
                  >
                    <Image src={leftArrow} alt="back" w="16px" mr={5} />
                    <Text textTransform="uppercase">Address</Text>
                  </Flex>

                  {isLoggedIn && (
                    <Link
                      as={RouterLink}
                      to="/add-address"
                      fontSize={{ base: "13px", md: "14px" }}
                      textTransform="uppercase"
                      display="flex"
                      alignItems="center"
                      gap={1}
                    >
                      <Box as="svg" width="18px" height="18px" viewBox="0 0 24 24" fill="none">
                        <path
                          d="M12 4V20M20 12H4"
                          stroke="#1D1D1D"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Box>
                      Add New Address
                    </Link>
                  )}
                </Flex>

                {/* WRAPPER BOX FOR BORDER */}
                <Box border="1px solid" borderColor="blackAlpha.500" p={4}>
                  {/* Address list */}
                  {displayAddresses.length > 0 &&
                    displayAddresses.map((item, index) => (
                      <Box
                        key={index}
                        w="full"
                        mt={{ base: 4, md: 0 }}
                        mb={{ md: 3 }}
                      >
                        <Box bg="#fafafa" border="1px solid #ebebeb" p={4}>
                          <Flex justify="space-between" align="center" pb={2} borderBottom="1px solid #ebebeb">
                            <Box w="55%">
                              <Flex
                                wrap="wrap"
                                gap={2}
                                color="black"
                                fontWeight="semibold"
                                fontSize={{ md: "lg" }}
                              >
                                <Text as="span">{item?.firstName}</Text>
                                <Text as="span">{item?.lastName}</Text>
                              </Flex>
                            </Box>

                            <Flex
                              align="center"
                              gap={4}
                              w="45%"
                              justify="flex-end"
                            >
                              {/* Edit & Remove Group */}
                              <Flex align="center" gap={6}>
                                {/* Edit */}
                                <Flex align="center" justify="center">
                                  <Link
                                    as={RouterLink}
                                    to={`/edit-address/${item.id}`}
                                    display="flex"
                                    alignItems="center"
                                  >
                                    <Box mr={1} display="inline-flex">
                                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_5795_10241)">
                                          <path d="M8.20705 2.26781C8.64175 1.79685 8.8591 1.56137 9.09005 1.42401C9.6473 1.09258 10.3335 1.08227 10.9001 1.39682C11.1349 1.52719 11.3589 1.75604 11.807 2.21375C12.255 2.67145 12.4791 2.90031 12.6067 3.14018C12.9146 3.71896 12.9045 4.41993 12.5801 4.98921C12.4456 5.22515 12.2151 5.44717 11.7541 5.89122L6.26858 11.1746C5.39491 12.0162 4.95806 12.4369 4.4121 12.6501C3.86613 12.8634 3.26593 12.8477 2.06552 12.8163L1.9022 12.8121C1.53676 12.8025 1.35404 12.7977 1.24782 12.6771C1.1416 12.5566 1.15611 12.3705 1.18511 11.9983L1.20086 11.7961C1.28249 10.7483 1.3233 10.2245 1.52789 9.75359C1.73249 9.28266 2.0854 8.90034 2.79123 8.13559L8.20705 2.26781Z" stroke="black" strokeLinejoin="round" />
                                          <path d="M7.58594 2.33203L11.6693 6.41536" stroke="black" strokeLinejoin="round" />
                                          <path d="M8.16406 12.832H12.8307" stroke="black" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_5795_10241">
                                            <rect width="14" height="14" fill="white" />
                                          </clipPath>
                                        </defs>
                                      </svg>

                                    </Box>
                                    <Text fontSize={"sm"} display={{ base: "none", sm: "inline" }}>Edit</Text>
                                  </Link>
                                </Flex>

                                {/* Remove */}
                                {item?.isDefault ? (
                                  <Flex
                                    role="button"
                                    tabIndex={0}
                                    align="center"
                                    justify="center"
                                    cursor="pointer"
                                    onClick={() => {
                                      if (item?.isDefault) {
                                        // toast.error("Default address cannot be deleted");
                                      } else {
                                        setShowDeleteModal(item.id);
                                      }
                                    }}
                                  >
                                    <Box mr={1} as="span">
                                      <Box
                                        as="svg"
                                        width="13px"
                                        height="13px"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                      >
                                        <path
                                          d="M12.6654 3.33301L3.33203 12.6664M3.33203 3.33301L12.6654 12.6664"
                                          stroke="#000"
                                          strokeWidth="1.5"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                        />
                                      </Box>
                                    </Box>
                                    <Text fontSize={"sm"} display={{ base: "none", sm: "inline" }}>Remove</Text>
                                  </Flex>
                                ) :
                                  (
                                    <Flex
                                      role="button"
                                      tabIndex={0}
                                      align="center"
                                      justify="center"
                                      cursor="pointer"
                                      onClick={() => {
                                        if (item?.isDefault) {
                                          // toast.error("Default address cannot be deleted");
                                        } else {
                                          setShowDeleteModal(item.id);
                                        }
                                      }}
                                    >
                                      <Box mr={1} as="span">
                                        <Box
                                          as="svg"
                                          width="13px"
                                          height="13px"
                                          viewBox="0 0 16 16"
                                          fill="none"
                                        >
                                          <path
                                            d="M12.6654 3.33301L3.33203 12.6664M3.33203 3.33301L12.6654 12.6664"
                                            stroke="#CD1F31"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </Box>
                                      </Box>
                                      <Text color={"#CD1F31"} fontSize={"sm"} display={{ base: "none", sm: "inline" }}>Remove</Text>
                                    </Flex>
                                  )}
                              </Flex>


                            </Flex>
                          </Flex>

                          <Flex justifyContent={"space-between"}>
                            <Flex flexDirection={"column"}>
                              <Box py={{ base: 2, md: 5 }}>
                                <Text
                                  fontSize={{ base: "xs", md: "sm" }}
                                  lineHeight="130%"
                                  letterSpacing="wide"
                                  color="#191616"
                                  m={0}
                                  maxW="46em"
                                >
                                  {item.address +
                                    " ,  " +
                                    (item?.cityName ?? "") +
                                    " ,  " +
                                    (item?.stateName ?? "") +
                                    " " +
                                    (item?.countryName ?? "")}
                                  .
                                </Text>
                              </Box>

                              <Box>
                                <Text
                                  fontSize={{ base: "xs", md: "sm" }}
                                  lineHeight="130%"
                                  letterSpacing="wide"
                                  color="#191616"
                                  m={0}
                                >
                                  Phone No :- {item.phone}
                                </Text>
                              </Box>
                            </Flex>
                            <Flex justifyContent={"flex-end"} alignItems={"flex-end"}>
                              {/* ---- MOBILE Default / Set Default at bottom ---- */}
                              <Box
                                mt={3}
                                display="flex"
                                justifyContent="flex-end"
                              >
                                <Box
                                  onClick={() => {
                                    if (!item?.isDefault) navigate(`/edit-address/${item.id}`, { state: { setAsDefault: true } });
                                  }}
                                >
                                  {item?.isDefault ? (
                                    <Flex
                                      gap={1}
                                      alignItems="center"
                                      as="span"
                                      color="black"
                                      fontSize="xs"
                                      p={0}
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_5795_10235)">
                                          <path d="M11 6C11 3.23857 8.7614 1 6 1C3.23857 1 1 3.23857 1 6C1 8.7614 3.23857 11 6 11C8.7614 11 11 8.7614 11 6Z" fill="#1D1D1D" stroke="#1D1D1D" />
                                          <path d="M4 6L5.5 7.5L8 4.5" stroke="white" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_5795_10235">
                                            <rect width="12" height="12" fill="white" />
                                          </clipPath>
                                        </defs>
                                      </svg>
                                      Default
                                    </Flex>
                                  ) : (
                                    <Flex
                                      gap={1}
                                      alignItems="center"
                                      as="span"
                                      role="button"
                                      color="black"
                                      fontSize="xs"
                                      p={0}
                                      whiteSpace="nowrap"
                                    >
                                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <g clipPath="url(#clip0_5795_2449)">
                                          <path d="M11 6C11 3.23857 8.7614 1 6 1C3.23857 1 1 3.23857 1 6C1 8.7614 3.23857 11 6 11C8.7614 11 11 8.7614 11 6Z" stroke="#1D1D1D" />
                                          <path d="M4 6L5.5 7.5L8 4.5" stroke="#1D1D1D" strokeLinecap="round" strokeLinejoin="round" />
                                        </g>
                                        <defs>
                                          <clipPath id="clip0_5795_2449">
                                            <rect width="12" height="12" fill="white" />
                                          </clipPath>
                                        </defs>
                                      </svg>
                                      Set as Default
                                    </Flex>
                                  )}
                                </Box>
                              </Box>
                            </Flex>
                          </Flex>
                        </Box>
                      </Box>
                    ))}

                  {/* Empty state */}
                  {(!Array.isArray(address) || address.length === 0) && (
                    <Box>
                      <Box textAlign="center">
                        <Box w={{ base: "50%", md: "250px" }} mx="auto">
                          <Image src={emptyicon} alt="Empty" />
                        </Box>
                        <Box my={4}>
                          <Heading as="h4" fontSize="lg" fontWeight="semibold">
                            Hey, it’s looks empty!
                          </Heading>
                          <Text fontSize="xs">
                            Oops! Your Address is empty. Start adding your address now.
                          </Text>
                        </Box>
                      </Box>

                      {isLoggedIn && (
                        <Link
                          as={RouterLink}
                          to="/add-address"
                          display={{ base: "none", md: "flex" }}
                          alignItems="center"
                          justifyContent="center"
                          bg="black"
                          color="white"
                          px={5}
                          py={2.5}
                          w="200px"
                          mx="auto"
                          _hover={{ textDecoration: "none" }}
                        >
                          Add New Address
                          <Box as="span" ml={2.5} display="inline-flex">
                            <PlusIcon size={16} />
                          </Box>
                        </Link>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
            </Flex>

            {/* Bottom actions (desktop) */}
            <Flex
              display={{ base: "none", md: "flex" }}
              wrap="wrap"
              justify="space-between"
              mt={4}
            >
              <Box display={{ base: "none", md: "block" }} w={{ md: "25%" }} />
              {Array.isArray(address) && address.length > 0 && isLoggedIn && (
                <Flex
                  w={{ base: "100%", lg: "66.666%" }}
                  p={{ md: 4 }}
                  wrap="wrap"
                  gap={2}
                >
                  {isLoggedIn && (
                    <Link
                      as={RouterLink}
                      to="/add-address"
                      display="flex"
                      alignItems="center"
                      bg="black"
                      color="white"
                      px={5}
                      py={2.5}
                      w="200px"
                    >
                      Add New Address
                      <Box as="span" ml={2.5} display="inline-flex">
                        <PlusIcon size={16} />
                      </Box>
                    </Link>
                  )}
                </Flex>
              )}
            </Flex>
          </Box>

          <Footer />

          {/* ----- MODALS ----- */}
          <ConfirmationModal
            title="Delete Address"
            subtitle="Are you sure you want to delete this address?"
            onConfirm={() => deleteAddress(showDeleteModal)}
            onCancel={() => setShowDeleteModal("")}
            isOpen={showDeleteModal}
          />
        </>
      )}
    </Fragment>
  );
};

export default Acaddress;
