import { Fragment, useEffect, useMemo, useState } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import { Box, Center, Heading, Skeleton, SkeletonText, Text } from "@chakra-ui/react";
import { useLocation } from "react-router-dom";
import { fetchPolicyContent } from "@/api/services/homeapi";

// ✅ Shimmer helper components (className="shimmer")
const ShimmerLine = ({ h = "10px", w = "100%", mb = 3, radius = "4px" }) => (
    <Box className="shimmer" h={h} w={w} mb={mb} borderRadius={radius} />
);

const ShimmerParagraph = ({ lines = 4, gap = 3 }) => (
    <Box>
        {Array.from({ length: lines }).map((_, i) => (
            <ShimmerLine
                key={i}
                h="10px"
                w={i === lines - 1 ? "85%" : "100%"}
                mb={i === lines - 1 ? 0 : gap}
            />
        ))}
    </Box>
);

const PAGE_MAP = {
    cookies: { title: "Cookie Policy" },
    shippingpolicy: { title: "Shipping Policy" },
    returnrefundpolicy: { title: "Return & Refund Policy" },
    terms: { title: "Terms & Conditions" },
    privacypolicy: { title: "Privacy Policy" },
    career: { title: "Careers" },
};

const Policies = () => {
    const isMobile = useMobile();
    const { pathname } = useLocation();

    // ✅ slug from URL like "/privacypolicy"
    const slug = useMemo(() => pathname.replace("/", "").toLowerCase(), [pathname]);

    const config = useMemo(() => PAGE_MAP[slug], [slug]);

    const [apiData, setApiData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errMsg, setErrMsg] = useState("");

    // Keys mapping for different policy types in the API response
    const POLICY_KEYS = {
        privacypolicy: "PRIVACY POLICY",
        terms: "Terms & Conditions",
        cookies: "Cookie Policy",
        shippingpolicy: "Shipping & Delivery",
        returnrefundpolicy: "Return & Exchange Policy" // Or likely "Return Policy" or "Exchange Policy" checks
    };

    const FOOTER_MSG_KEYS = {
        privacypolicy: "PRIVACY POLICY Footer Message",
        terms: "Terms & Conditions Footer Message",
        cookies: "Cookie Policy Footer Message",
        shippingpolicy: "Shipping & Delivery Footer Message",
        returnrefundpolicy: "Return and Exchange Policy Footer Message"
    };

    const DESC_KEYS = {
        privacypolicy: "PRIVACY POLICY Description",
        terms: "Terms & Conditions Description",
        cookies: "Cookie Policy Description",
        shippingpolicy: "Shipping & Delivery Description",
        returnrefundpolicy: "Return and Exchange Policy Description"
    };


    useEffect(() => {
        if (!config) return;

        let cancelled = false;
        setErrMsg("");

        if (!apiData) setLoading(true);

        (async () => {
            try {
                if (!apiData) setLoading(true);
                const data = await fetchPolicyContent();
                if (!cancelled) {
                    setApiData(data);
                    setLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    setErrMsg(e?.message || "Failed to load page content");
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);


    if (!config) return <div>Page not found</div>;
    if (loading) {
        return (
            <Fragment>
                <LogoNavbar />
                <CartQuickView />
                {/* Desktop title shimmer */}
                <Box display={{ base: "none", md: "block" }} mt="90px" py={4}>
                    <Box textAlign="center" display="flex" flexDirection="column" alignItems="center">
                        <Box className="shimmer" height="40px" width="300px" borderRadius="6px" />
                    </Box>
                </Box>

                {/* Body shimmer */}
                <Box my="50px" px={isMobile ? "12px" : "50px"} pt={{ base: 2, md: 0 }} pb={0}>
                    <ShimmerParagraph lines={4} />
                    <Box mt={10}>
                        <ShimmerParagraph lines={4} />
                    </Box>
                    <Box mt={10}>
                        <ShimmerParagraph lines={4} />
                    </Box>
                </Box>
                <Footer />
            </Fragment>
        );
    }
    if (errMsg) return <div>{errMsg}</div>;

    // Helper to extract content
    const getPolicyContent = () => {
        if (!apiData?.body?.policy) return null;

        const policyData = apiData.body.policy;
        // Determine which array to render based on slug/config
        // For returnrefundpolicy it seems there might be "Return Policy" AND "Exchange Policy"

        let contentArray = [];
        let description = "";
        let footerMsg = "";

        if (slug === 'returnrefundpolicy') {
            // Combine Return and Exchange policies if needed, or just show them sequentially
            const returnPolicy = policyData["Return Policy"] || [];
            const exchangePolicy = policyData["Exchange Policy"] || [];
            //  flatten
            contentArray = [
                ...(returnPolicy.length ? [{ Heading: "Return Policy", Description: "" }] : []),
                ...returnPolicy,
                ...(exchangePolicy.length ? [{ Heading: "Exchange Policy", Description: "" }] : []),
                ...exchangePolicy
            ];
            description = policyData[DESC_KEYS[slug]];
            footerMsg = policyData[FOOTER_MSG_KEYS[slug]];

        } else {
            const key = POLICY_KEYS[slug];
            contentArray = policyData[key] || [];
            description = policyData[DESC_KEYS[slug]];
            footerMsg = policyData[FOOTER_MSG_KEYS[slug]];
        }

        return { contentArray, description, footerMsg };
    };

    const { contentArray, description, footerMsg } = getPolicyContent() || {};


    return (
        <Fragment>
            <LogoNavbar />
            <CartQuickView />

            <Box mt={{ base: "60px", md: "90px" }} py={4}>
                <Box textAlign="center">
                    <Heading
                        as="h1"
                        fontSize={{ base: "24px", md: "24px" }}
                        fontWeight="normal"
                        // fontFamily="Dm Serif Display"
                        textTransform="uppercase"
                        textAlign="center"
                    >
                        {config.title}
                    </Heading>
                </Box>
            </Box>

            <Box my="5px" px={isMobile ? "20px" : "50px"} pt={{ base: 2, md: 0 }} pb={0}>
                {/* Introduction Description */}
                {description && (
                    <Box mb={6} whiteSpace="pre-wrap" fontSize={{ base: "12px", md: "16px" }} lineHeight="1.6" color="#333">
                        {description}
                    </Box>
                )}

                {/* Structured Content */}
                {contentArray && contentArray.length > 0 ? (
                    <Box>
                        {contentArray.map((item, idx) => (
                            <Box key={idx} mb={6}>
                                {item.Heading && (
                                    <Heading as="h3" fontSize={{ base: "20px", md: "24px" }} mb={3} fontWeight="normal">
                                        {item.Heading}
                                    </Heading>
                                )}
                                {item.Description && (
                                    <Box whiteSpace="pre-wrap" color="#555" fontSize={{ base: "12px", md: "15px" }} lineHeight="1.7">
                                        {item.Description}
                                    </Box>
                                )}
                            </Box>
                        ))}
                    </Box>
                ) : (
                    <Box h="60vh">
                        <Center h="100%">
                            <Text fontSize="sm" color="gray.600" textAlign="center">
                                No details available.
                            </Text>
                        </Center>
                    </Box>
                )}

                {/* Footer Message */}
                {footerMsg && (
                    <Box mt={8} fontWeight="bold" whiteSpace="pre-wrap" fontSize={{ base: "14px", md: "16px" }}>
                        {footerMsg}
                    </Box>
                )}

            </Box>
            <Footer />
        </Fragment>
    );
};

export default Policies;
