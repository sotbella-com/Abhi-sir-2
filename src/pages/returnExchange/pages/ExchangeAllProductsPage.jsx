import React, { Fragment, useEffect, useRef, useState } from "react";
import { useLocation, useSearchParams, useNavigate } from "react-router-dom";
import {
  Box,
  VStack,
  Text,
  Center,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Container,
} from "@chakra-ui/react";

import { useMobile } from "@/components/molecules";
import { ScrollToTop } from "@/components/compounds";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";

import ChakraFilterSection from "@/components/common/ChakraFilterSection";

import { ShimmerProducts } from "@/components/layouts";
import ShimmerGridProducts from "@/components/layouts/Simmers/ShimmerGridProducts";

import {
  searchCategoryProducts,
  getCategoryRefinements,
} from "@/api/services/categorySearch";

import {
  transformSFCCProduct,
  transformSFCCRefinements,
  buildRefinements,
} from "@/utils/sfccProductTransform";

import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import ChakraProductListingSimple from "@/components/common/ChakraProductListingSimple";
import ChakraProductListingZigZag from "@/components/common/ChakraProductListingZigZag";
import ChakraProductListingGrid from "@/components/common/ChakraProductListingGrid";

// ✅ CHANGE START: read exchange context from zustand + keep backward compatibility
import { useReturnExchangeStore } from "@/context/returnExchangeStore"; // adjust path if different
import ProductListingSimple from "./components/ProductListingSimple";
import ProductListingZigZag from "./components/ProductListingZigZag";
import ProductListingGrid from "./components/ProductListGrid";
// ✅ CHANGE END

const PAGE_SIZE = 24;

const ExchangeAllProductsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMobile();

  // ✅ CHANGE START: URL flags (production-safe routing guard)
  const isDifferentExchange =
    searchParams.get("isDifferentExchange") === "true" ||
    searchParams.get("exchange") === "true";
  const urlOrderId = searchParams.get("orderId") || "";
  // ✅ CHANGE END

  /**
   * ✅ CHANGE START:
   * Primary source = Zustand store (persisted) ✅
   * Fallback 1 = location.state (older flow / direct navigate with state) ✅
   * Fallback 2 = sessionStorage (older flow) ✅
   *
   * This keeps existing functionality while shifting production flow to store + URL flags.
   */
  const storeExchangeContext = useReturnExchangeStore((s) => s.exchangeContext);
  const setExchangeContext = useReturnExchangeStore((s) => s.setExchangeContext);
  const clearExchangeContext = useReturnExchangeStore((s) => s.clearExchangeContext);

  const stateExchangeContext = location?.state?.exchangeContext || null;

  const sessionExchangeContext = (() => {
    try {
      const raw = sessionStorage.getItem("exchangeContext");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  })();

  // Final resolved exchange context
  const exchangeContext =
    storeExchangeContext || stateExchangeContext || sessionExchangeContext || null;

  // Optional: keep store in sync if we arrived via state/session (helps refresh)
  useEffect(() => {
    if (!storeExchangeContext && exchangeContext) {
      try {
        setExchangeContext(exchangeContext);
      } catch {
        // no-op
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeExchangeContext, exchangeContext]);
  // ✅ CHANGE END

  // ✅ CHANGE START: guard - if user opens this page directly without exchange flow, redirect back safely
  useEffect(() => {
    // Only guard if URL claims exchange but context missing, OR page opened without exchange flag.
    // This avoids breaking older flows that still pass state.
    if (!isDifferentExchange && !exchangeContext) {
      // If your project has a dedicated return/exchange landing page, redirect there instead.
      navigate("/", { replace: true });
      return;
    }

    // If flag is present but context missing, redirect (prevents broken exchange flow).
    if (isDifferentExchange && !exchangeContext) {
      toast?.error?.("Exchange context missing. Please start exchange from your order.");
      navigate("/", { replace: true });
    }
  }, [isDifferentExchange, exchangeContext, navigate]);
  // ✅ CHANGE END


  const [filtersApplied, setFiltersApplied] = useState(false);

  // fixed category: yellow
  const categoryId = "yellow";

  // Data state
  const [products, setProducts] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState({});
  const [filterData, setFilterData] = useState({
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: { min: 0, max: 0 },
  });

  // Loading + paging
  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  // View & sorting
  const [activeView, setActiveView] = useState("simple");
  const [sortingOptions, setSortingOptions] = useState([]);

  // Size guide
  const {
    isOpen: isSizeGuideOpen,
    onOpen: onSizeGuideOpen,
    onClose: onSizeGuideClose,
  } = useDisclosure();

  // Filters
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedSort, setSelectedSort] = useState("");

  // Price state
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [priceChange, setPriceChange] = useState([0, 0]);

  const fromCategory = {
    slug: categoryId,
    name: "ALL PRODUCTS",
  };

  const observerRef = useRef(null);

  // Map picked UI names -> facet ids from filterList
  const pickIds = (picked = [], list = []) =>
    Array.isArray(picked) && Array.isArray(list)
      ? picked.map((n) => list.find((o) => o?.name === n)?.id ?? n)
      : picked || [];

  const fetchCategoryProducts = async (pageNumber = 1, append = false) => {
    setLoading(pageNumber === 1);
    setIsFetchingMore(pageNumber > 1);

    try {
      const priceDefault =
        filterData?.price &&
        priceRange.min === filterData.price.min &&
        priceRange.max === filterData.price.max;

      const refinements = buildRefinements({
        categories: pickIds(selectedCategories, filterData.categories),
        colors: pickIds(selectedColors, filterData.colors),
        materials: pickIds(selectedMaterials, filterData.materials),
        sizes: pickIds(selectedSizes, filterData.sizes),
        priceRange: !priceDefault ? priceRange : null,
      });

      const response = await searchCategoryProducts("yellow", {
        limit: PAGE_SIZE,
        offset: (pageNumber - 1) * PAGE_SIZE,
        filters: refinements,
        sort: selectedSort,
        siteId: null,
      });

      const transformed =
        response.hits?.map(transformSFCCProduct).filter(Boolean) || [];

      const total = Number(response.total || 0);
      const pages = Math.ceil(total / PAGE_SIZE);

      setProducts((prev) => (append ? [...prev, ...transformed] : transformed));
      setTotalProducts(total);
      setTotalPages(pages);
      setCurrentPage(pageNumber);
      setHasMore(pageNumber < pages);

      setCategoryDetails({
        id: "yellow",
        name: "ALL PRODUCTS",
        totalProducts: total,
      });
    } catch (e) {
      // optional: console.error(e)
    } finally {
      setLoading(false);
      setIsFetchingMore(false);
    }
  };

  const fetchFilterData = async () => {
    try {
      const [refinementsRes, hitsRes] = await Promise.all([
        getCategoryRefinements("yellow"),
        searchCategoryProducts("yellow", { limit: 48, offset: 0, siteId: null }),
      ]);

      const transformedFilters = transformSFCCRefinements(
        refinementsRes?.refinements || [],
        hitsRes?.hits || []
      );
      setFilterData(transformedFilters);

      // initialize price from backend
      if (
        transformedFilters.price?.min !== undefined &&
        transformedFilters.price?.max !== undefined
      ) {
        setPriceRange(transformedFilters.price);
        setPriceChange([
          transformedFilters.price.min,
          transformedFilters.price.max,
        ]);
      }

      // Sorting options from API
      const apiSortingOptions =
        refinementsRes?.sortingOptions || hitsRes?.sortingOptions || [];
      const dynamicSortingOptions = (apiSortingOptions || []).map((option) => ({
        id: option.id,
        name: option.label || option.name || option.id,
      }));
      setSortingOptions(dynamicSortingOptions);

      if (
        dynamicSortingOptions.length > 0 &&
        !dynamicSortingOptions.some((o) => o.id === selectedSort)
      ) {
        setSelectedSort("");
      }
    } catch (e) {
      // optional: console.error(e)
    }
  };

  const updateURL = () => {
    const params = {};
    const priceDefault =
      filterData?.price &&
      priceRange.min === filterData.price.min &&
      priceRange.max === filterData.price.max;

    if (!priceDefault) params.price = `${priceRange.min},${priceRange.max}`;
    if (selectedSort) params.sort = selectedSort;

    // ✅ CHANGE START: preserve exchange flags in URL (don’t lose them when filters update)
    if (isDifferentExchange) params.isDifferentExchange = "true";
    if (urlOrderId) params.orderId = urlOrderId;
    // ✅ CHANGE END

    setSearchParams(params, { replace: true });
  };

  useEffect(() => {
    (async () => {
      setFiltersApplied(false);
      setCurrentPage(1);
      setHasMore(true);
      await fetchFilterData();
      await fetchCategoryProducts(1, false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange,
    selectedSort,
    // ✅ CHANGE START
    isDifferentExchange,
    urlOrderId,
    // ✅ CHANGE END
  ]);

  useEffect(() => {
    setCurrentPage(1);
    setHasMore(true);
    fetchCategoryProducts(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange,
    selectedSort,
  ]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first.isIntersecting) return;
        if (loading || isFetchingMore || !hasMore) return;

        const next = currentPage + 1;
        if (next <= totalPages) {
          fetchCategoryProducts(next, true);
        }
      },
      { root: null, rootMargin: "300px 0px 0px 0px", threshold: 0 }
    );

    const el = observerRef.current;
    if (el) io.observe(el);
    return () => {
      if (el) io.unobserve(el);
    };
  }, [currentPage, totalPages, hasMore, loading, isFetchingMore]);

  const handleClearAllFromDrawer = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setPriceRange({ min: 0, max: 0 });
    setPriceChange([0, 0]);
    setSelectedSort("");

    // ✅ CHANGE START: preserve exchange flags even after "Clear All"
    const params = {};
    if (isDifferentExchange) params.isDifferentExchange = "true";
    if (urlOrderId) params.orderId = urlOrderId;
    setSearchParams(params, { replace: true });
    // ✅ CHANGE END

    setFiltersApplied(false);

    const basePath = window.location.pathname;
    // ✅ CHANGE START: keep query params (exchange flags) on hard refresh
    const qs = new URLSearchParams(params).toString();
    window.location.assign(qs ? `${basePath}?${qs}` : basePath);
    // ✅ CHANGE END
  };

  return (
    <Fragment>
      <Box>
        <LogoNavbar />
        <CartQuickView />

        <Box h={"70px"} />

        {/* Breadcrumb */}
        <Container
          maxW="full"
          px={{ base: "12px", md: "75px" }}
          pt={2}
          fontSize={{ base: "9px", md: "xs" }}
        >
          <Breadcrumb spacing="10px" separator={<Text> / </Text>}>
            <BreadcrumbItem>
              <BreadcrumbLink
                textTransform="uppercase"
                onClick={() => navigate("/")}
              >
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>

            <BreadcrumbItem isCurrentPage>
              <Text
                color="black"
                fontWeight="semibold"
                textTransform="uppercase"
              >
                Choose product for exchange
              </Text>
            </BreadcrumbItem>
          </Breadcrumb>

          {/* optional tiny helper line */}
          {/* ✅ CHANGE START: show helper from stored context (works after refresh) */}
          {exchangeContext?.items?.[0]?.productId && (
            <Text mt={2} fontSize="xs" color="gray.500">
              Selecting a new product to exchange with your previous item.
            </Text>
          )}
          {/* ✅ CHANGE END */}
        </Container>

        {/* Filters */}
        <ChakraFilterSection
          filterList={filterData}
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          setSelectedColor={setSelectedColors}
          setSelectedMaterial={setSelectedMaterials}
          selectedColor={selectedColors}
          selectedMaterial={selectedMaterials}
          selectedSize={selectedSizes}
          setSelectedSize={setSelectedSizes}
          setPriceChange={setPriceChange}
          setSelectedSort={setSelectedSort}
          selectedSort={selectedSort}
          sortingOptions={sortingOptions}
          activeView={activeView}
          setActiveView={setActiveView}
          searchText=""
          priceRange={
            priceChange?.length
              ? { min: parseInt(priceChange[0]), max: parseInt(priceChange[1]) }
              : null
          }
          onApply={(payload) => {
            setSelectedCategories(payload.categories || []);
            setSelectedColors(payload.colors || []);
            setSelectedMaterials(payload.materials || []);
            setSelectedSizes(payload.sizes || []);
            setPriceRange(payload.price || { min: 0, max: 0 });
            setSelectedSort(payload.sort || "");
            setFiltersApplied(true);
          }}
          filtersApplied={filtersApplied}
          onClearAll={handleClearAllFromDrawer}
        />

        {/* Listings */}
        <Box position="relative">
          {loading && products.length === 0 ? (
            <Box px={{ base: "12px", md: "75px" }}>
              {activeView === "grid" ? (
                <ShimmerGridProducts count={8} />
              ) : (
                <ShimmerProducts />
              )}
            </Box>
          ) : (
            <>
              <ProductListingSimple
                collectionPoduct={products}
                loading={false}
                setOpenSizeGuide={onSizeGuideOpen}
                isActive={activeView === "simple"}
                fromCollection={fromCategory}
                sortBy={selectedSort}
                exchangeContext={exchangeContext}
                isExchangeFlow={true}
                // ✅ ADD THESE:
                orderId={urlOrderId}
                isDifferentExchange={true}
              />

              <ProductListingZigZag
                collectionPoduct={products}
                loading={false}
                setOpenSizeGuide={onSizeGuideOpen}
                isActive={activeView === "zigzag"}
                fromCollection={fromCategory}
                sortBy={selectedSort}
                exchangeContext={exchangeContext}
                isExchangeFlow={true}
                // ✅ ADD THESE:
                orderId={urlOrderId}
                isDifferentExchange={true}
              />

              <ProductListingGrid
                collectionPoduct={products}
                loading={false}
                setOpenSizeGuide={onSizeGuideOpen}
                isActive={activeView === "grid"}
                fromCollection={fromCategory}
                sortBy={selectedSort}
                exchangeContext={exchangeContext}
                isExchangeFlow={true}
                // ✅ ADD THESE:
                orderId={urlOrderId}
                isDifferentExchange={true}
              />

            </>
          )}

          {products?.length === 0 && !loading && (
            <Center py={20}>
              <VStack spacing={4}>
                <Text fontSize="sm" color="gray.500">
                  No products found...
                </Text>
              </VStack>
            </Center>
          )}

          <Box ref={observerRef} h="1px" />

          {isFetchingMore && products.length > 0 && (
            <Box py={1} px={{ base: "12px", md: "75px" }}>
              {activeView === "grid" ? (
                <ShimmerGridProducts count={4} />
              ) : (
                <ShimmerProducts />
              )}
            </Box>
          )}
        </Box>

        <Footer />
      </Box>

      <ScrollToTop />

      <Drawer
        isOpen={isSizeGuideOpen}
        onClose={onSizeGuideClose}
        placement="bottom"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>
            <Text fontSize="lg" fontWeight="semibold">
              Size Guide
            </Text>
          </DrawerHeader>
          <DrawerBody>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                This is a dummy size guide. In a real application, this would
                contain actual size chart information.
              </Text>
              <Box p={4} bg="gray.50" borderRadius="md">
                <Text fontSize="sm" fontWeight="semibold" mb={2}>
                  Size Chart
                </Text>
                <Text fontSize="xs" color="gray.600">
                  XS: 32-34 | S: 34-36 | M: 36-38 | L: 38-40 | XL: 40-42 | XXL:
                  42-44
                </Text>
              </Box>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};

export default ExchangeAllProductsPage;
