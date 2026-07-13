import React, { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  VStack,
  Flex,
  Text,
  Link,
  useColorModeValue,
} from "@chakra-ui/react";

import { LogoutAnimation } from "@/assets/animation";
import { LottieModal } from "@/components/compounds";
import ConfirmationModal from "@/components/compounds/confirmationModal";
import { useAddressStore } from "@/context";
import { useUnifiedCartStore } from "@/context/unifiedCartStore";
import { useAuth } from "@/context/AuthContext";
import { toast } from "react-toastify";

const Row = ({ to, active, onClick, children, danger = false }) => {
  const borderColor = useColorModeValue("blackAlpha.600", "whiteAlpha.600");
  const activeBorderColor = useColorModeValue("black", "white");

  const baseColor = danger ? "red.600" : "blackAlpha.700";
  const activeColor = danger ? "red.600" : "black";

  return (
    <Box
      opacity={1}
      pb={2}
      mb={4}
      borderBottomWidth="1px"
      borderColor={active ? activeBorderColor : borderColor}
    >
      <Link
        as={RouterLink}
        to={to}
        onClick={onClick}
        _hover={{ textDecoration: "none", color: danger ? "red.700" : "black" }}
      >
        <Flex
          align="center"
          gap={2}
          fontSize="sm"
          fontWeight="medium"
          textTransform="uppercase"
          fontFamily="Lato, sans-serif"
          color={active ? activeColor : baseColor} 
        >
          {children}
        </Flex>
      </Link>
    </Box>
  );
};

const ProfileSideBar = ({ activeTab = "ORDER" }) => {
  const [showModal, setShowModal] = useState(false);
  const [showLottieModal, setShowLottieModal] = useState(false);

  const { logout } = useAuth();
  const { clearBasket } = useUnifiedCartStore();
  const { setAddress } = useAddressStore();

  const handleLogout = async () => {
    setShowLottieModal(true);

    setTimeout(async () => {
      try {
        setAddress([]);
        clearBasket();
        await logout();
        // toast.success("Logout Successfully");
      } catch (error) {
        // toast.error(error?.message || "Logout failed");
      } finally {
        setShowLottieModal(false);
      }
    }, 3000);
  };

  return (
    <Box display={{ base: "none", lg: "block" }} w={{ lg: "25%" }}>
      <VStack as="ul" spacing={0} align="stretch" p={0} maxW="315px" w="full">
        {/* Orders */}
        <Row to="/order" active={activeTab === "ORDER"}>
          <Box as="span">
            {/* stroke uses currentColor so active state makes it black */}
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C11.1818 22 10.4002 21.6698 8.83693 21.0095C4.94564 19.3657 3 18.5438 3 17.1613C3 16.7742 3 10.0645 3 7M12 22C12.8182 22 13.5998 21.6698 15.1631 21.0095C19.0544 19.3657 21 18.5438 21 17.1613V7M12 22V11.3548"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8.32592 9.69138L5.40472 8.27785C3.80157 7.5021 3 7.11423 3 6.5C3 5.88577 3.80157 5.4979 5.40472 4.72215L8.32592 3.30862C10.1288 2.43621 11.0303 2 12 2C12.9697 2 13.8712 2.4362 15.6741 3.30862L18.5953 4.72215C20.1984 5.4979 21 5.88577 21 6.5C21 7.11423 20.1984 7.5021 18.5953 8.27785L15.6741 9.69138C13.8712 10.5638 12.9697 11 12 11C11.0303 11 10.1288 10.5638 8.32592 9.69138Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M6 12L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M17 4L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </Box>
          <Text>Order History</Text>
        </Row>

        {/* Wallet */}
        <Row to="/wallet" active={activeTab === "WALLET"}>
          <Box as="span">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M16 14C16 14.8284 16.6716 15.5 17.5 15.5C18.3284 15.5 19 14.8284 19 14C19 13.1716 18.3284 12.5 17.5 12.5C16.6716 12.5 16 13.1716 16 14Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M10 7H16C18.8284 7 20.2426 7 21.1213 7.87868C22 8.75736 22 10.1716 22 13V15C22 17.8284 22 19.2426 21.1213 20.1213C20.2426 21 18.8284 21 16 21H10C6.22876 21 4.34315 21 3.17157 19.8284C2 18.6569 2 16.7712 2 13V11C2 7.22876 2 5.34315 3.17157 4.17157C4.34315 3 6.22876 3 10 3H14C14.93 3 15.395 3 15.7765 3.10222C16.8117 3.37962 17.6204 4.18827 17.8978 5.22354C18 5.60504 18 6.07003 18 7"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>
          <Text>Wallet & Transactions</Text>
        </Row>

        {/* Coupons */}
        <Row to="/coupons" active={activeTab === "COUPON"}>
          <Box as="span">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M7.69171 19.6161C8.28274 19.6161 8.57825 19.6161 8.84747 19.716C8.88486 19.7298 8.92172 19.7451 8.95797 19.7617C9.21897 19.8815 9.42793 20.0904 9.84585 20.5083C10.8078 21.4702 11.2887 21.9512 11.8805 21.9955C11.96 22.0015 12.04 22.0015 12.1195 21.9955C12.7113 21.9512 13.1923 21.4702 14.1541 20.5083C14.5721 20.0904 14.781 19.8815 15.042 19.7617C15.0783 19.7451 15.1151 19.7298 15.1525 19.716C15.4218 19.6161 15.7173 19.6161 16.3083 19.6161H16.4173C17.9252 19.6161 18.6792 19.6161 19.1476 19.1476C19.6161 18.6792 19.6161 17.9252 19.6161 16.4173V16.3083C19.6161 15.7173 19.6161 15.4218 19.716 15.1525C19.7298 15.1151 19.7451 15.0783 19.7617 15.042C19.8815 14.781 20.0904 14.5721 20.5083 14.1541C21.4702 13.1923 21.9512 12.7113 21.9955 12.1195C22.0015 12.04 22.0015 11.96 21.9955 11.8805C21.9512 11.2887 21.4702 10.8078 20.5083 9.84585C20.0904 9.42793 19.8815 9.21897 19.7617 8.95797C19.7451 8.92172 19.7298 8.88486 19.716 8.84747C19.6161 8.57825 19.6161 8.28274 19.6161 7.69171V7.58269C19.6161 6.07479 19.6161 5.32083 19.1476 4.85239C18.6792 4.38394 17.9252 4.38394 16.4173 4.38394H16.3083C15.7173 4.38394 15.4218 4.38394 15.1525 4.28405C15.1151 4.27018 15.0783 4.25491 15.042 4.23828C14.781 4.11855 14.5721 3.90959 14.1541 3.49167C13.1923 2.52977 12.7113 2.04882 12.1195 2.00447C12.04 1.99851 11.96 1.99851 11.8805 2.00447C11.2887 2.04882 10.8078 2.52977 9.84585 3.49167C9.42793 3.90959 9.21897 4.11855 8.95797 4.23828C8.92172 4.25491 8.88486 4.27018 8.84747 4.28405C8.57825 4.38394 8.28274 4.38394 7.69171 4.38394H7.58269C6.07479 4.38394 5.32083 4.38394 4.85239 4.85239C4.38394 5.32083 4.38394 6.07479 4.38394 7.58269V7.69171C4.38394 8.28274 4.38394 8.57825 4.28405 8.84747C4.27018 8.88486 4.25491 8.92172 4.23828 8.95797C4.11855 9.21897 3.90959 9.42793 3.49167 9.84585C2.52977 10.8078 2.04882 11.2887 2.00447 11.8805C1.99851 11.96 1.99851 12.04 2.00447 12.1195C2.04882 12.7113 2.52977 13.1923 3.49167 14.1541C3.90959 14.5721 4.11855 14.781 4.23828 15.042C4.25491 15.0783 4.27018 15.1151 4.23828 15.042C4.38394 15.4218 4.38394 15.7173 4.38394 16.3083V16.4173C4.38394 17.9252 4.38394 18.6792 4.85239 19.1476C5.32083 19.6161 6.07479 19.6161 7.58269 19.6161H7.69171Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M15 9L9 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M15 15H14.9892M9.01076 9H9"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Box>
          <Text>Coupons</Text>
        </Row>

        {/* Addresses */}
        <Row to="/customer-address" active={activeTab === "ADDRESS"}>
          <Box as="span">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M13.6177 21.367C13.1841 21.773 12.6044 22 12.0011 22C11.3978 22 10.8182 21.773 10.3845 21.367C6.41302 17.626 1.09076 13.4469 3.68627 7.37966C5.08963 4.09916 8.45834 2 12.0011 2C15.5439 2 18.9126 4.09916 20.316 7.37966C22.9082 13.4393 17.599 17.6389 13.6177 21.367Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M15.5 11C15.5 12.933 13.933 14.5 12 14.5C10.067 14.5 8.5 12.933 8.5 11C8.5 9.067 10.067 7.5 12 7.5C13.933 7.5 15.5 9.067 15.5 11Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
            </svg>
          </Box>
          <Text>Addresses</Text>
        </Row>

        {/* Account Details */}
        <Row to="/manage-profile" active={activeTab === "ACCOUNT"}>
          <Box as="span">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7.5 17C9.8317 14.5578 14.1432 14.4428 16.5 17M14.4951 9.5C14.4951 10.8807 13.3742 12 11.9915 12C10.6089 12 9.48797 10.8807 9.48797 9.5C9.48797 8.11929 10.6089 7 11.9915 7C13.3742 7 14.4951 8.11929 14.4951 9.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </Box>
          <Text>Account Details</Text>
        </Row>

        {/* Logout */}
        <Box opacity={1}>
          <Box
            pb={2}
            color="#FF0000"
            borderBottomWidth={activeTab === "LOGOUT" ? "1px" : "0"}
            borderColor="black"
          >
            <Link
              as={RouterLink}
              to="#"
              onClick={() => setShowModal(true)}
              _hover={{ textDecoration: "none", color: "#f20707ff" }}
            >
              <Flex
                align="center"
                gap={2}
                fontSize="sm"
                fontWeight="medium"
                textTransform="uppercase"
                fontFamily="Lato, sans-serif"
                color="#FF0000"
              >
                <Box as="span">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 3L10.3374 3.23384C7.75867 4.144 6.46928 4.59908 5.73464 5.63742C5 6.67576 5 8.0431 5 10.7778V13.2222C5 15.9569 5 17.3242 5.73464 18.3626C6.46928 19.4009 7.75867 19.856 10.3374 20.7662L11 21"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M21 12H11M21 12C21 11.2998 19.0057 9.99153 18.5 9.5M21 12C21 12.7002 19.0057 14.0085 18.5 14.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Box>
                <Text>Logout</Text>
              </Flex>
            </Link>
          </Box>
        </Box>
      </VStack>

      {/* ---- Modals ---- */}
      <ConfirmationModal
        isOpen={showModal}
        onConfirm={handleLogout}
        onCancel={() => setShowModal(false)}
        title="Are You sure, you want to Logout?"
        subtitle=""
      />

      <LottieModal
        title="Logging out ..."
        isOpen={showLottieModal}
        animationData={LogoutAnimation}
      />
    </Box>
  );
};

export default ProfileSideBar;
