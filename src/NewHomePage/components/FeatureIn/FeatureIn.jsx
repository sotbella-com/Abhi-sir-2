import React, { useEffect, useMemo, useState } from "react";
import { VStack, HStack, Box, Text, Link, Image } from "@chakra-ui/react";
import { fetchHomePageContent } from "@/api/services";

const isImageType = (type = "") => String(type).toLowerCase().includes("image");

const FeatureIn = ({ siteId = null }) => {
  const [home, setHome] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        setLoading(true);
        const data = await fetchHomePageContent(siteId);
        if (!alive) return;
        setHome(data);
      } catch (e) {
        if (!alive) return;
        setHome(null);
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [siteId]);

  const featured = useMemo(() => {
    const arr = home?.footer?.["AS FEATURED IN"];
    const list = Array.isArray(arr) ? arr : [];

    // ✅ keep only images, ignore any unexpected entries
    return list.filter((item) => isImageType(item?.type) && item?.link);
  }, [home]);

  if (loading) {
    return (
      <VStack spacing={{ base: 3, md: 4 }} pt={{ base: 4, md: 6 }} px={{ base: "2vw", lg: "4vw" }} w="100%">
        <Box className="shimmer" h="16px" w="120px" />
        <HStack spacing={3} justify="center" flexWrap="wrap" w="100%">
          {Array.from({ length: 3 }).map((_, i) => (
            <Box
              key={i}
              className="shimmer"
              borderRadius={{ base: "md", md: "xl" }}
              w={{ base: "100%", sm: "33%", lg: "250px" }}
              maxW="250px"
              h={{ base: "44px", sm: "45px", md: "70px" }}
            />
          ))}
        </HStack>
      </VStack>
    );
  }

  if (!featured.length) return null;

  return (
    <VStack
      spacing={{ base: 3, md: 4 }}
      pt={{ base: 4, md: 6 }}
      px={{ base: "2vw", lg: "4vw", xl: "4vw" }}
      w="100%"
    >
      <Box w="100%" display="flex" alignItems="center" gap={4}>
        {/* Left line */}
        <Box flex="1" h="1px" bg="blackAlpha.300" />

        {/* Center text */}
        <Text
          fontSize={{ base: "sm", md: "md" }}
          letterSpacing="0.08em"
          textTransform="uppercase"
          whiteSpace="nowrap"
          color="black"
        >
          As Featured In
        </Text>

        {/* Right line */}
        <Box flex="1" h="1px" bg="blackAlpha.300" />
      </Box>

      <HStack spacing={3} justify="center" flexWrap="wrap" w="100%" gap={{ base: 4, md: 10 }}>
        {featured.map((item, idx) => {
          const href = item?.href || "#";
          const imgSrc = item?.link;
          const title = item?.title || "Featured";

          return (
            <Link
              key={`${title}-${idx}`}
              href={href}
              isExternal
              display="block"
              flex={{ base: "1 1 0", lg: "0 0 auto" }}
              w={{ base: "100px", sm: "33%", lg: "150px" }}
              maxW={{ base: "100px", lg: "150px" }}
              _hover={{ textDecoration: "none", transform: "scale(1.03)" }}
              transition="transform 0.2s ease"
              onClick={(e) => {
                if (!href || href === "#") e.preventDefault();
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="center"
                w="100%"
                // h={{ base: "44px", sm: "45px", md: "70px" }}
                cursor="pointer"
                px={2}
                py={1}
              >
                <Image
                  src={imgSrc}
                  alt={title}
                  maxW="100%"
                  maxH="100%"
                  objectFit="contain"
                  loading="lazy"
                  decoding="async"
                />
              </Box>
            </Link>
          );
        })}
      </HStack>
    </VStack>
  );
};

export default FeatureIn;
