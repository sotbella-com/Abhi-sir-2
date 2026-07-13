import React, { useMemo } from "react";
import { Box, Flex, Text, HStack, Image } from "@chakra-ui/react";
import { StarIcon } from "@chakra-ui/icons";
import TestimonialsModal from "@/components/layouts/FooterComp/TestimonialsModal";

const getName = (r) =>
    (r?.authorName || r?.customerName || r?.reviewerName || "Anonymous")
        .toString()
        .toUpperCase();

const getText = (r) => r?.text || r?.review || r?.comment || "";

const getDate = (r) => {
    const d = r?.createdAt ? new Date(r.createdAt) : null;
    return d && !isNaN(d) ? d.toLocaleDateString("en-GB") : "";
};

const getRating = (r) => {
    const n = Number(r?.rating ?? 0);
    if (!Number.isFinite(n)) return 0;
    return Math.max(0, Math.min(5, Math.round(n)));
};

export default function SeeReviewModal({
    isOpen,
    onClose,
    review,
    product,
    zIndex = 100000000,
}) {
    const rating = useMemo(() => (review ? getRating(review) : 0), [review]);

    const media = useMemo(() => {
        if (!review) return "";
        return (
            review?.mediaUrls?.[0] ||
            review?.mediaAssets?.[0] ||
            // product?.images?.[0]?.src || // Removed fallback
            // product?.image ||            // Removed fallback
            ""
        );
    }, [review]); // removed product dependency

    if (!isOpen) return null;

    return (
        <TestimonialsModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Review details"
            zIndex={zIndex}
            centered
            height={media ? "80vh" : "auto"}
            width={media ? undefined : "600px"}
            closeOnOverlay
        >
            {!review ? null : (
                <Flex
                    h={media ? "80vh" : "auto"}
                    w="100%"
                    direction={{ base: "column", md: "row" }}
                >
                    {/* ✅ LEFT: Full image column - ONLY IF MEDIA EXISTS */}
                    {media && (
                        <Box
                            w={{ base: "100%", md: "45%" }}
                            h={{ base: "260px", md: "100%" }}
                            bg="blackAlpha.50"
                            flexShrink={0}
                        >
                            <Image
                                src={media}
                                alt={getName(review)}
                                w="100%"
                                h="100%"
                                objectFit="contain"
                                objectPosition="top"
                                draggable={false}
                                fallbackSrc="/api/placeholder/600/900"
                            />
                        </Box>
                    )}

                    {/* ✅ RIGHT: Scroll area (scrollbar hidden) */}
                    <Box
                        w={media ? { base: "100%", md: "55%" } : "100%"}
                        h={media ? { base: "calc(80vh - 260px)", md: "100%" } : "100%"}
                        overflowY="auto"
                        className="scrollbar-hide"
                        p={{ base: 4, md: 8 }}
                    >
                        <Flex justify="space-between" align="center" mb={2} mt={{ md: 4 }}>
                            <Text fontSize="md" fontWeight="600" letterSpacing="0.06em">
                                {getName(review)}
                            </Text>

                            <HStack spacing={0.5}>
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <StarIcon
                                        key={i}
                                        boxSize={4}
                                        color={i < rating ? "black" : "blackAlpha.300"}
                                    />
                                ))}
                            </HStack>
                        </Flex>

                        <Text fontSize="sm" color="blackAlpha.600" mb={4}>
                            {getDate(review)}
                        </Text>

                        <Text fontSize="sm" lineHeight="1.9" whiteSpace="pre-wrap">
                            {getText(review)}
                        </Text>
                    </Box>
                </Flex>
            )}
        </TestimonialsModal>
    );
}
