import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ProfileSideBar } from "@/components/layouts";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import leftArrow from "@/assets/images/left-arrow.png";
import { CURRENCY_SYMBOL } from "@/constants/constants";
import { useMobile } from "@/components/molecules";
import CartQuickView from "../ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import emptyicon from "../../assets/images/empty.png";

// ✅ Wallet API
import {
  getWalletTransactions,
  normalizeWalletTransaction,
} from "@/api/services/wallet";

import {
  Box,
  Flex,
  Heading,
  Text,
  Image,
  Button,
} from "@chakra-ui/react";
import { LucideRefreshCw } from "lucide-react";
import ShimmerWallet from "@/components/layouts/Simmers/ShimmerWallet";

const formatDate = (date) =>
  new Date(date).toLocaleString("en-IN", {
    year: "numeric",
    month: "long",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

const Wallet = () => {
  const navigate = useNavigate();
  const isMobile = useMobile();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [walletBalance, setWalletBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  const handleBack = () => navigate(-1);

  const fetchWallet = async (opts = {}) => {
    setLoading(true);
    setError("");

    try {
      const res = await getWalletTransactions();

      const txns = res?.data?.transactions || [];
      const wallet = res?.data?.wallet || null;

      setWalletBalance(Number(wallet?.balance || 0));
      setTransactions(txns.map(normalizeWalletTransaction));

    } catch (e) {
      // console.error("Wallet fetch error:", e);
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const hasTransactions = transactions?.length > 0;

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
            textTransform="uppercase"
          >
            My Account / Wallet
          </Heading>
        </Box>
      </Box>

      <Box pb={5} pt={{ base: 12, md: 10 }} px={{ base: "12px", md: "50px" }}>
        <Flex wrap="wrap" justify="space-between" gap={4}>
          <ProfileSideBar activeTab={"WALLET"} />

          <Box w={{ base: "100%", lg: "66.666%" }}>
            {/* Top bar (mobile back) */}
            <Flex justify="space-between" align="flex-end" mt={isMobile ? 4 : 0}>
              <Box fontWeight="semibold" fontSize="xl" color="black">
                <Flex
                  onClick={handleBack}
                  fontWeight="medium"
                  fontSize="15px"
                  color="black"
                  align="center"
                  mb={2}
                  display={{ base: "flex", md: "none" }}
                  cursor="pointer"
                >
                  <Image src={leftArrow} w="16px" mr={5} alt="Back" />
                  <Text textTransform="uppercase">Wallet</Text>
                </Flex>
              </Box>
              {/* <LucideRefreshCw onClick={() => fetchWallet({ page })} isDisabled={loading} cursor={"pointer"} /> */}
            </Flex>

            {/* WRAPPER BOX FOR BORDER */}
            <Box border="1px solid" borderColor="blackAlpha.500" p={4}>
              {/* NOTE + TOTAL BALANCE ROW */}
              <Flex
                justify="space-between"
                align="center"
                mb={5}
                mt={{ base: 2, md: 0 }}
                flexWrap="wrap"
                gap={2}
              >
                <Text fontSize="xs">
                  <Text as="span" fontWeight="bold" color="blackAlpha.800">
                    PLEASE NOTE
                  </Text>{" "}
                  <Text as="span" color="blackAlpha.600">
                    Your wallet activity will be shown here after you make a purchase on the Sotbella app.
                  </Text>
                </Text>

                <Text fontSize={{ base: "sm", md: "md" }} fontWeight="semibold">
                  TOTAL BALANCE{" "}
                  <Text as="span" ml={2}>
                    {CURRENCY_SYMBOL} {Number(walletBalance).toFixed(2)}
                  </Text>
                </Text>
              </Flex>

              {/* ERROR BOX (Commented out in original, keeping it here if needed or just skipping) */}

              {/* TRANSACTION HISTORY / LOADING / EMPTY */}
              {loading ? (
                // ✅ LOADING (Shimmer) - removed border
                <Box>
                  <ShimmerWallet rows={4} />
                </Box>
              ) : hasTransactions ? (
                // ✅ HAS TRANSACTIONS - heading + removed border
                <Box
                  overflowX={{ base: "hidden", md: "auto" }}
                  overflowY={{ base: "hidden", md: "auto" }}
                  maxH={{ base: "none", md: "500px" }}
                  className="scroll-thin"
                >
                  <Flex justify="space-between" align="center" mb={2}>
                    <Text fontSize="sm" fontWeight="semibold" textTransform="uppercase">
                      Transaction History
                    </Text>
                  </Flex>

                  {transactions.map((item, index) => {
                    const transactionType = item.raw?.type;

                    const isCredit = [
                      "credit",
                      "manual_credit",
                      "cashback_reward",
                    ].includes(transactionType);

                    const isDebit = [
                      "debit",
                      "manual_debit",
                      "cashback_reversal"
                    ].includes(transactionType);

                    const amountColor = isDebit
                      ? "#cd1f31"
                      : isCredit
                        ? "#4cb56aff"
                        : "inherit";

                    const amountPrefix = isDebit
                      ? "-"
                      : isCredit
                        ? "+"
                        : "";

                    return (
                      <Flex
                        key={item.id || index}
                        justify="space-between"
                        wrap="wrap"
                        borderBottom="1px solid"
                        borderColor={
                          index === transactions.length - 1
                            ? "transparent"
                            : "blackAlpha.200"
                        }
                        pb={index === transactions.length - 1 ? 0 : 4}
                        mb={index === transactions.length - 1 ? 0 : 4}
                      >
                        {/* Left block */}
                        <Box w={{ base: "100%", sm: "75%" }}>
                          <Text fontSize="14px" color="black" mb={1}>
                            <Box as="span" fontWeight="normal">
                              Transaction ID - {item.transactionId}
                            </Box>

                            {item.orderId && (
                              <>
                                <Box as="span" display="inline-block" px={2}>
                                  |
                                </Box>
                                <Box as="span">Order ID - {item.orderId}</Box>
                              </>
                            )}
                          </Text>

                          <Text fontSize="sm" color="#1d1d1d" my={1}>
                            Remark - {item.remark}
                          </Text>

                          <Text fontSize="11px" color="blackAlpha.600">
                            Date{" "}
                            <Box as="span" fontWeight="semibold" pl={1}>
                              {formatDate(item.date)}
                            </Box>
                          </Text>
                        </Box>

                        {/* Right amount */}
                        <Box
                          w={{ base: "100%", sm: "25%" }}
                          textAlign="right"
                        >
                          <Text
                            fontSize="14px"
                            fontWeight="bold"
                            color={amountColor}
                          >
                            {amountPrefix} {CURRENCY_SYMBOL}{" "}
                            {Number(item.amount || 0).toFixed(2)}
                          </Text>
                        </Box>
                      </Flex>
                    );
                  })}
                </Box>
              ) : (
                // ✅ EMPTY - NO border, NO heading
                <Box textAlign="center">
                  <Box w={{ base: "50%", md: "250px" }} mx="auto">
                    <Image src={emptyicon} alt="Empty" />
                  </Box>
                  <Box my={4}>
                    <Heading as="h4" fontSize="lg" fontWeight="semibold">
                      Hey, it’s looks empty!
                    </Heading>
                    <Text fontSize="xs">
                      Your wallet transaction history is empty. Make your first purchase from App to access exclusive deals.
                    </Text>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        </Flex>
      </Box>
      <Footer />
    </Fragment>
  );
};

export default Wallet;
