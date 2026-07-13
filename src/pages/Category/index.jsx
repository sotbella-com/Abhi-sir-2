import React, {
  Fragment,
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useDebounce } from "@/Hooks/useDebounce";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
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
  Flex,
} from "@chakra-ui/react";

import { useMobile } from "@/components/molecules";
import { ScrollToTop } from "@/components/compounds";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";
import CartQuickView from "../ProductDetails/components/cartQuickView";

import ChakraFilterSection from "@/components/common/ChakraFilterSection";
import ChakraProductListingSimple from "@/components/common/ChakraProductListingSimple";
import ChakraProductListingZigZag from "@/components/common/ChakraProductListingZigZag";
import ChakraProductListingGrid from "@/components/common/ChakraProductListingGrid";

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
import { getCategoryInfo } from "@/utils/categoryLinks";
import { trackViewCategory } from "@/api/services/einsteinTracking";
import { Image as ChakraImage } from "@chakra-ui/react";

const PAGE_SIZE = 12;

/** -------------------- Cache helpers -------------------- **/
const CACHE_VERSION = "v1";
const SS_KEY = `CategoryPageCache:${CACHE_VERSION}`;

// marker keys (set by PDP)
const BACK_MARK = "__BACK_FROM_PDP__";
const BACK_QUERYKEY = "__BACK_FROM_PDP_QUERYKEY__";
const BACK_SCROLLY = "__BACK_FROM_PDP_SCROLLY__";
const BACK_PAGE = "__BACK_FROM_PDP_PAGE__";

const memoryCache = {
  filtersByCategory: new Map(), // catId -> { filterData, sortingOptions, ts }
  productsByQuery: new Map(), // queryKey -> { pages: Map(page->payload), meta, ts }
};

const now = () => Date.now();
const FILTER_TTL_MS = 15 * 60 * 1000;
const PRODUCTS_TTL_MS = 15 * 60 * 1000;

const loadSessionCache = () => {
  try {
    const raw = sessionStorage.getItem(SS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const saveSessionCache = (obj) => {
  try {
    sessionStorage.setItem(SS_KEY, JSON.stringify(obj));
  } catch {
    // ignore quota errors
  }
};

const hydrateFromSession = () => {
  const ss = loadSessionCache();
  if (!ss) return;

  if (ss.filtersByCategory) {
    Object.entries(ss.filtersByCategory).forEach(([k, v]) => {
      memoryCache.filtersByCategory.set(k, v);
    });
  }

  if (ss.productsByQuery) {
    Object.entries(ss.productsByQuery).forEach(([k, v]) => {
      const pagesMap = new Map();
      if (v.pages) {
        Object.entries(v.pages).forEach(([pageStr, payload]) => {
          pagesMap.set(Number(pageStr), payload);
        });
      }
      memoryCache.productsByQuery.set(k, { ...v, pages: pagesMap });
    });
  }
};

const persistToSession = () => {
  const filtersObj = {};
  memoryCache.filtersByCategory.forEach((v, k) => {
    filtersObj[k] = v;
  });

  const productsObj = {};
  memoryCache.productsByQuery.forEach((v, k) => {
    const pagesObj = {};
    v.pages?.forEach((payload, page) => {
      pagesObj[String(page)] = payload;
    });
    productsObj[k] = { ...v, pages: pagesObj };
  });

  saveSessionCache({
    filtersByCategory: filtersObj,
    productsByQuery: productsObj,
  });
};

// hydrate once (browser only)
if (typeof window !== "undefined") {
  hydrateFromSession();
}

/** -------------------- URL helpers -------------------- **/
const toCSV = (arr = []) => arr.map(encodeURIComponent).join(",");

const fromCSV = (str = "") =>
  String(str)
    .split(",")
    .map((s) => decodeURIComponent(s))
    .map((s) => s.trim())
    .filter(Boolean);

const parsePrice = (p) => {
  if (!p) return null;
  const [min, max] = String(p)
    .split(",")
    .map((x) => Number(x));
  if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
  return null;
};

const stableStringify = (obj) => {
  try {
    const allKeys = [];
    JSON.stringify(obj, (key, value) => {
      allKeys.push(key);
      return value;
    });
    allKeys.sort();
    return JSON.stringify(obj, allKeys);
  } catch {
    return String(obj);
  }
};

const CategoryPage = () => {
  const { categoryId: categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useMobile();
  const navigate = useNavigate();
  const location = useLocation(); // kept (might be used elsewhere)
  const [activeView, setActiveView] = useState("simple");
  const [campaignProducts, setCampaignProducts] = useState([]);

  useEffect(() => {
    const storedView = sessionStorage.getItem("activeView");
    if (storedView) setActiveView(storedView);
  }, []);

  useEffect(() => {
    sessionStorage.setItem("activeView", activeView);
  }, [activeView]);

  const categoryId = categorySlug;
  const categoryInfo = getCategoryInfo(categoryId);

  const normalizeCategoryName = (value) => {
    if (!value) return "";
    return String(value)
      .replace(/[_-]+/g, " ")
      .trim()
      .replace(/\s+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const rawName = categoryInfo?.name || categorySlug;

  const finalCategoryInfo = categoryInfo || {
    name: normalizeCategoryName(rawName) || "Loading...",
    description: "Loading category information...",
  };

  /** -------------------- State -------------------- **/
  const [products, setProducts] = useState([]);
  const [categoryDetails, setCategoryDetails] = useState({});
  const [filterData, setFilterData] = useState({
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: { min: 0, max: 0 },
  });

  const [loading, setLoading] = useState(false);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [filtersApplied, setFiltersApplied] = useState(false);
  const [sortingOptions, setSortingOptions] = useState([]);

  const {
    isOpen: isSizeGuideOpen,
    onOpen: onSizeGuideOpen,
    onClose: onSizeGuideClose,
  } = useDisclosure();

  // read URL -> initial selection
  const [selectedCategories, setSelectedCategories] = useState(() =>
    fromCSV(searchParams.get("cat") || ""),
  );
  const [selectedColors, setSelectedColors] = useState(() =>
    fromCSV(searchParams.get("color") || ""),
  );
  const [selectedMaterials, setSelectedMaterials] = useState(() =>
    fromCSV(searchParams.get("mat") || ""),
  );
  const [selectedSizes, setSelectedSizes] = useState(() =>
    fromCSV(searchParams.get("size") || ""),
  );
  const [selectedSort, setSelectedSort] = useState(
    () => searchParams.get("sort") || "",
  );

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [priceChange, setPriceChange] = useState([0, 0]);

  const showFilters = loading || products.length > 0 || filtersApplied;

  const fromCategory = useMemo(
    () => ({
      slug: categoryId,
      name: categoryDetails?.name || finalCategoryInfo?.name || "Loading...",
    }),
    [categoryId, categoryDetails?.name, finalCategoryInfo?.name],
  );

  const observerRef = useRef(null);
  const requestIdRef = useRef(0);

  // block debounced fetch during bootstrap
  const bootstrapRef = useRef(true);
  const skipDebounceRef = useRef(false);

  // back-from-PDP restore (scroll once after list paints)
  const backRestorePendingRef = useRef(false);

  // Map picked UI names -> facet ids from filterList (if UI stores names)
  const pickIds = useCallback((picked = [], list = []) => {
    if (!Array.isArray(picked) || !Array.isArray(list)) return picked || [];
    return picked.map((n) => list.find((o) => o?.name === n)?.id ?? n);
  }, []);

  const sfccCategoryId = useMemo(() => {
    return categoryId === "new-in"
      ? "new-in"
      : categoryInfo?.sfccCategoryId || categoryId;
  }, [categoryId, categoryInfo?.sfccCategoryId]);

  /** -------------------- Build refinements + cache queryKey -------------------- **/
  const priceDefault =
    filterData?.price &&
    priceRange.min === filterData.price.min &&
    priceRange.max === filterData.price.max;

  const refinementsPayload = useMemo(() => {
    return buildRefinements({
      categories: pickIds(selectedCategories, filterData.categories),
      colors: pickIds(selectedColors, filterData.colors),
      materials: pickIds(selectedMaterials, filterData.materials),
      sizes: pickIds(selectedSizes, filterData.sizes),
      priceRange:
        !priceDefault && (priceRange.min !== 0 || priceRange.max !== 0)
          ? priceRange
          : null,
    });
  }, [
    pickIds,
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange.min,
    priceRange.max,
    priceDefault,
    filterData.categories,
    filterData.colors,
    filterData.materials,
    filterData.sizes,
  ]);

  const queryKey = useMemo(() => {
    return [
      "cat",
      sfccCategoryId,
      "sort",
      selectedSort || "",
      "filters",
      stableStringify(refinementsPayload),
    ].join("|");
  }, [sfccCategoryId, selectedSort, refinementsPayload]);

  /** -------------------- Cache reads/writes -------------------- **/
  const getCachedFilters = useCallback((catId) => {
    const v = memoryCache.filtersByCategory.get(catId);
    if (!v) return null;
    if (now() - (v.ts || 0) > FILTER_TTL_MS) return null;
    return v;
  }, []);

  const setCachedFilters = useCallback((catId, payload) => {
    memoryCache.filtersByCategory.set(catId, { ...payload, ts: now() });
    persistToSession();
  }, []);

  const getCachedPage = useCallback((qKey, page) => {
    const q = memoryCache.productsByQuery.get(qKey);
    if (!q) return null;
    if (now() - (q.ts || 0) > PRODUCTS_TTL_MS) return null;
    return q.pages?.get(page) || null;
  }, []);

  const setCachedPage = useCallback((qKey, page, payload, meta) => {
    const existing = memoryCache.productsByQuery.get(qKey);
    const pages = existing?.pages ? new Map(existing.pages) : new Map();
    pages.set(page, payload);

    memoryCache.productsByQuery.set(qKey, {
      pages,
      meta: meta || existing?.meta || {},
      ts: now(),
    });

    persistToSession();
  }, []);

  /** -------------------- Fetch facets (cache-aware) -------------------- **/
  const fetchFilterData = useCallback(async () => {
    const cached = getCachedFilters(sfccCategoryId);
    if (cached) {
      setFilterData(cached.filterData);
      setSortingOptions(cached.sortingOptions || []);

      // init price (respect URL)
      const priceFromUrl = parsePrice(searchParams.get("price"));
      if (priceFromUrl) {
        setPriceRange(priceFromUrl);
        setPriceChange([priceFromUrl.min, priceFromUrl.max]);
      } else if (cached.filterData?.price) {
        setPriceRange(cached.filterData.price);
        setPriceChange([
          cached.filterData.price.min,
          cached.filterData.price.max,
        ]);
      }

      // sanitize sort if invalid
      if (
        (cached.sortingOptions || []).length > 0 &&
        selectedSort &&
        !(cached.sortingOptions || []).some((o) => o.id === selectedSort)
      ) {
        setSelectedSort("");
      }

      return null;
    }

    try {
      const [refinementsRes, hitsRes] = await Promise.all([
        getCategoryRefinements(sfccCategoryId),
        searchCategoryProducts(sfccCategoryId, {
          limit: PAGE_SIZE,
          offset: 0,
          siteId: null,
        }),
      ]);

      const transformedFilters = transformSFCCRefinements(
        refinementsRes?.refinements || [],
        hitsRes?.hits || [],
      );

      const apiSortingOptions =
        refinementsRes?.sortingOptions || hitsRes?.sortingOptions || [];
      const dynamicSortingOptions = (apiSortingOptions || []).map((option) => ({
        id: option.id,
        name: option.label || option.name || option.id,
      }));

      setFilterData(transformedFilters);
      setSortingOptions(dynamicSortingOptions);

      // init price from backend (respect URL)
      if (
        transformedFilters.price?.min !== undefined &&
        transformedFilters.price?.max !== undefined
      ) {
        const priceFromUrl = parsePrice(searchParams.get("price"));
        if (priceFromUrl) {
          setPriceRange(priceFromUrl);
          setPriceChange([priceFromUrl.min, priceFromUrl.max]);
        } else {
          setPriceRange(transformedFilters.price);
          setPriceChange([
            transformedFilters.price.min,
            transformedFilters.price.max,
          ]);
        }
      }

      // sanitize sort
      if (
        dynamicSortingOptions.length > 0 &&
        selectedSort &&
        !dynamicSortingOptions.some((o) => o.id === selectedSort)
      ) {
        setSelectedSort("");
      }

      setCachedFilters(sfccCategoryId, {
        filterData: transformedFilters,
        sortingOptions: dynamicSortingOptions,
      });

      // ✅ RETURN the fetched hits so we can reuse them
      return { hitsRes };
    } catch (e) {
      return null;
    }
  }, [
    sfccCategoryId,
    getCachedFilters,
    setCachedFilters,
    searchParams,
    selectedSort,
  ]);

  /** -------------------- Fetch products (cache per page) -------------------- **/
  const fetchCategoryProducts = useCallback(
    async (
      pageNumber = 1,
      append = false,
      options = { preferCache: false },
    ) => {
      const reqId = ++requestIdRef.current;
      const preferCache = Boolean(options?.preferCache);

      // ✅ cache serve only when preferCache = true (PDP back)
      if (preferCache) {
        const cachedPage = getCachedPage(queryKey, pageNumber);
        if (cachedPage) {
          const { items, total, pages } = cachedPage;

          setProducts((prev) => (append ? [...prev, ...items] : items));
          setTotalProducts(total);
          setTotalPages(pages);
          setCurrentPage(pageNumber);
          setHasMore(pageNumber < pages);

          setCategoryDetails({
            id: categoryId,
            name: categoryId?.replace(/-/g, " ").toUpperCase(),
            totalProducts: total,
          });

          if (reqId === requestIdRef.current) {
            setLoading(false);
            setIsFetchingMore(false);
          }
          return;
        }
      }

      // loaders only when not cached (or preferCache false)
      setLoading(pageNumber === 1);
      setIsFetchingMore(pageNumber > 1);

      try {
        const response = await searchCategoryProducts(sfccCategoryId, {
          limit: PAGE_SIZE,
          offset: (pageNumber - 1) * PAGE_SIZE,
          filters: refinementsPayload,
          sort: selectedSort,
          siteId: null,
          allImages: true,
        });

        if (reqId !== requestIdRef.current) return;

        const transformed =
          response.hits?.map(transformSFCCProduct).filter(Boolean) || [];
        const total = Number(response.total || 0);
        const pages = Math.ceil(total / PAGE_SIZE);

        setProducts((prev) =>
          append ? [...prev, ...transformed] : transformed,
        );
        setTotalProducts(total);
        setTotalPages(pages);
        setCurrentPage(pageNumber);
        setHasMore(pageNumber < pages);

        setCategoryDetails({
          id: categoryId,
          name: categoryId?.replace(/-/g, " ").toUpperCase(),
          totalProducts: total,
        });

        // Track viewCategory for Einstein Commerce Cloud (only on first page)
        if (pageNumber === 1 && sfccCategoryId) {
          const sortingRule = selectedSort
            ? [
              {
                attribute: selectedSort.includes("price")
                  ? "price"
                  : "relevance",
                direction: selectedSort.includes("desc")
                  ? "descending"
                  : "ascending",
              },
            ]
            : null;

          trackViewCategory(
            sfccCategoryId,
            transformed.map((p) => ({ id: p.id || p.productId })),
            sortingRule,
            { start: 0 },
          );
        }

        // ✅ cache write always (so PDP back gets it)
        setCachedPage(
          queryKey,
          pageNumber,
          { items: transformed, total, pages },
          { categoryId, sfccCategoryId },
        );
      } catch (e) {
        // optionally handle error
      } finally {
        if (reqId === requestIdRef.current) {
          setLoading(false);
          setIsFetchingMore(false);
        }
      }
    },
    [
      categoryId,
      sfccCategoryId,
      refinementsPayload,
      selectedSort,
      queryKey,
      getCachedPage,
      setCachedPage,
    ],
  );

  /** -------------------- URL sync -------------------- **/
  const updateURL = useCallback(() => {
    const params = new URLSearchParams(searchParams);

    if (selectedCategories?.length)
      params.set("cat", toCSV(selectedCategories));
    else params.delete("cat");

    if (selectedColors?.length) params.set("color", toCSV(selectedColors));
    else params.delete("color");

    if (selectedMaterials?.length) params.set("mat", toCSV(selectedMaterials));
    else params.delete("mat");

    if (selectedSizes?.length) params.set("size", toCSV(selectedSizes));
    else params.delete("size");

    // price only if changed from backend default
    const priceDefaultLocal =
      filterData?.price &&
      priceRange.min === filterData.price.min &&
      priceRange.max === filterData.price.max;

    if (!priceDefaultLocal)
      params.set("price", `${priceRange.min},${priceRange.max}`);
    else params.delete("price");

    if (selectedSort) params.set("sort", selectedSort);
    else params.delete("sort");

    if (params.toString() !== searchParams.toString()) {
      setSearchParams(params, { replace: true });
    }
  }, [
    searchParams,
    setSearchParams,
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    selectedSort,
    filterData?.price,
    priceRange.min,
    priceRange.max,
  ]);

  /** -------------------- Bootstrap (category/query change) -------------------- **/
  useEffect(() => {
    (async () => {
      requestIdRef.current += 1;
      const localReqId = requestIdRef.current;

      bootstrapRef.current = true;

      setFiltersApplied(false);
      setCurrentPage(1);
      setHasMore(true);
      setInitialFetchDone(false);

      // detect back-from-PDP (and tie it to queryKey if provided)
      backRestorePendingRef.current = false;
      if (typeof window !== "undefined") {
        const backFlag = sessionStorage.getItem(BACK_MARK) === "1";
        const backQ = sessionStorage.getItem(BACK_QUERYKEY) || "";
        // if no queryKey was saved, still restore; if saved, restore only when it matches
        if (backFlag && (!backQ || backQ === queryKey)) {
          backRestorePendingRef.current = true;
        }
      }

      // ✅ if NOT coming back from PDP, force top
      if (!backRestorePendingRef.current) {
        window.scrollTo({ top: 0, behavior: "auto" });
      }

      // ✅ Ensure shimmer shows on first entry
      if (!backRestorePendingRef.current) {
        setProducts([]);
        setLoading(true);
      }

      // ✅ Track if we actually restored list from cache (to prevent overwrite)
      let restoredFromCache = false;

      // ✅ helper: max cached page for this queryKey
      const getMaxCachedPageForQuery = (qKey) => {
        const q = memoryCache.productsByQuery.get(qKey);
        const keys = q?.pages ? Array.from(q.pages.keys()) : [];
        if (!keys.length) return 0;
        return Math.max(...keys);
      };

      // ✅ Try instant restore from cache ONLY when back from PDP
      if (backRestorePendingRef.current) {
        const backPageRaw = Number(sessionStorage.getItem(BACK_PAGE));
        const maxCached = getMaxCachedPageForQuery(queryKey);

        // restore upto actual cached pages; BACK_PAGE (if present) works as an upper cap
        const restoreTo =
          backPageRaw > 0 ? Math.min(maxCached, backPageRaw) : maxCached;

        let merged = [];
        let total = 0;
        let pages = 1;
        let lastPageLoaded = 0;

        for (let p = 1; p <= restoreTo; p++) {
          const cached = getCachedPage(queryKey, p);
          if (!cached?.items?.length) break;
          merged = merged.concat(cached.items);
          total = cached.total || total;
          pages = cached.pages || pages;
          lastPageLoaded = p;
        }

        if (merged.length) {
          setProducts(merged);
          setTotalProducts(total);
          setTotalPages(pages);
          setCurrentPage(lastPageLoaded);
          setHasMore(lastPageLoaded < pages);
          setLoading(false);
          restoredFromCache = true; // ✅ IMPORTANT
        } else {
          setLoading(true);
          setProducts([]);
        }
      }

      // Fetch filters (or load from cache)
      const fetchResult = await fetchFilterData();

      // ✅ CHECK params to see if we have specific filters/sort applied via URL
      const hasUrlFilters =
        searchParams.has("cat") ||
        searchParams.has("color") ||
        searchParams.has("mat") ||
        searchParams.has("size") ||
        searchParams.has("sort") ||
        searchParams.has("price");

      // ✅ Re-use data ONLY if:
      // 1) got fresh data (fetchResult.hitsRes)
      // 2) no URL filters active
      // 3) not restoring from PDP
      if (
        fetchResult?.hitsRes &&
        !hasUrlFilters &&
        !backRestorePendingRef.current
      ) {
        const { hitsRes } = fetchResult;

        if (requestIdRef.current === localReqId) {
          const transformed =
            hitsRes.hits?.map(transformSFCCProduct).filter(Boolean) || [];
          const total = Number(hitsRes.total || 0);
          const pages = Math.ceil(total / PAGE_SIZE);

          setProducts(transformed);
          setTotalProducts(total);
          setTotalPages(pages);
          setHasMore(1 < pages);
          setLoading(false);

          setCategoryDetails({
            id: categoryId,
            name: categoryId?.replace(/-/g, " ").toUpperCase(),
            totalProducts: total,
          });

          trackViewCategory(
            sfccCategoryId,
            transformed.map((p) => ({ id: p.id || p.productId })),
            null,
            { start: 0 },
          );

          setCachedPage(
            queryKey,
            1,
            { items: transformed, total, pages },
            { categoryId, sfccCategoryId },
          );
        }
      } else {
        // ✅ Fetch products normally ONLY if we did NOT restore list from cache
        if (!restoredFromCache) {
          await fetchCategoryProducts(1, false, {
            preferCache: backRestorePendingRef.current,
          });
        }
      }

      // ✅ Suppress redundant debounce fetch triggered by initial state sync
      skipDebounceRef.current = true;
      setInitialFetchDone(true);
      bootstrapRef.current = false;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  /** -------------------- Debounced refetch for filters/sort -------------------- **/
  const debouncedCategories = useDebounce(selectedCategories, 300);
  const debouncedColors = useDebounce(selectedColors, 300);
  const debouncedMaterials = useDebounce(selectedMaterials, 300);
  const debouncedSizes = useDebounce(selectedSizes, 300);
  const debouncedPriceRange = useDebounce(priceRange, 300);
  const debouncedSort = useDebounce(selectedSort, 300);

  // URL update after init
  useEffect(() => {
    if (!initialFetchDone) return;
    updateURL();
  }, [
    initialFetchDone,
    updateURL,
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange,
    selectedSort,
  ]);

  // refetch after debounced change (and not during bootstrap)
  useEffect(() => {
    if (!initialFetchDone) return;
    if (bootstrapRef.current) return;

    // ✅ Prevent double-fetch from initial hydration
    if (skipDebounceRef.current) {
      skipDebounceRef.current = false;
      return;
    }

    requestIdRef.current += 1;
    setCurrentPage(1);
    setHasMore(true);

    fetchCategoryProducts(1, false, { preferCache: false });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    debouncedCategories,
    debouncedColors,
    debouncedMaterials,
    debouncedSizes,
    debouncedPriceRange,
    debouncedSort,
  ]);

  /** -------------------- Infinite scroll observer -------------------- **/
  useEffect(() => {
    const el = observerRef.current;
    if (!el) return;

    if (loading || isFetchingMore || !hasMore || products.length < PAGE_SIZE)
      return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (!first.isIntersecting) return;

        if (loading || isFetchingMore || !hasMore) return;

        const nextPage = currentPage + 1;
        if (nextPage <= totalPages) {
          fetchCategoryProducts(nextPage, true, { preferCache: false });
        }
      },
      { threshold: 1 },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [
    products.length,
    loading,
    isFetchingMore,
    hasMore,
    currentPage,
    totalPages,
    fetchCategoryProducts,
  ]);

  /** -------------------- Clear all -------------------- **/
  const handleClearAllFromDrawer = useCallback(() => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setSelectedSort("");

    const min = filterData?.price?.min ?? 0;
    const max = filterData?.price?.max ?? 0;

    setPriceRange({ min, max });
    setPriceChange([min, max]);

    setSearchParams({}, { replace: true });
    setFiltersApplied(false);
  }, [filterData?.price?.min, filterData?.price?.max, setSearchParams]);

  /** -------------------- filtersApplied from URL once price is known -------------------- **/
  useEffect(() => {
    if (!filterData?.price) return;

    const price = parsePrice(searchParams.get("price"));

    if (price) {
      setPriceRange(price);
      setPriceChange([price.min, price.max]);
    } else {
      setPriceRange(filterData.price);
      setPriceChange([filterData.price.min, filterData.price.max]);
    }

    const hasAny =
      selectedCategories.length ||
      selectedColors.length ||
      selectedMaterials.length ||
      selectedSizes.length ||
      selectedSort ||
      price;

    setFiltersApplied(Boolean(hasAny));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterData?.price?.min, filterData?.price?.max]);

  /** -------------------- Restore scroll when coming back from PDP -------------------- **/
  useEffect(() => {
    if (!initialFetchDone) return;
    if (!backRestorePendingRef.current) return;
    if (!products?.length) return;

    const raf = requestAnimationFrame(() => {
      try {
        const y = Number(sessionStorage.getItem(BACK_SCROLLY));
        if (Number.isFinite(y) && y > 0) {
          window.scrollTo({ top: y, behavior: "auto" });
        }

        // clear markers so normal navigation doesn’t keep restoring
        sessionStorage.removeItem(BACK_MARK);
        sessionStorage.removeItem(BACK_QUERYKEY);
        sessionStorage.removeItem(BACK_SCROLLY);
        sessionStorage.removeItem(BACK_PAGE);
      } finally {
        backRestorePendingRef.current = false;
      }
    });

    return () => cancelAnimationFrame(raf);
  }, [initialFetchDone, products?.length]);


  // const currentHiddenState = ["unmuted", "UNMUTED", "unmuted-1", "UNMUTED-1"].includes(rawName);

  const currentHiddenState = [""].includes(rawName);

  sessionStorage.setItem(
    "isHidden",
    JSON.stringify(currentHiddenState)
  );

  const isHidden = JSON.parse(sessionStorage.getItem("isHidden"));

  const checkCampaignProducts = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_WALLET_API_URL}/api/cashback/check-campaign-products`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collectionName: categorySlug,
          }),
        }
      );

      const data = await response.json();

      console.log("Campaign Products Response:", data);

      setCampaignProducts(data); 
    } catch (error) {
      console.error("Campaign Products API Error:", error);
    }
  };

  useEffect(() => {
    checkCampaignProducts();
  }, []);


const updatedProducts = products.map(product => {
  const currentProductId =
    product?.representedProduct?.id ||
    product?.size?.productId;

  const baseProductId = currentProductId?.replace(
    /(XXL|XL|XS|L|M|S)$/i,
    ""
  );

  const campaignData = campaignProducts?.data?.find(
    campaign => campaign.productId === baseProductId
  );

  return {
    ...product,
    hasCampaign: !!campaignData,
    campaignData: campaignData || null
  };
});

console.log("Updated Products with Campaign Data:", updatedProducts);


  return (
    <Fragment>
      <Box>
        {isHidden ? (
          <Flex
            justify="center"
            align="center"
            w="100%"
          >
            <ChakraImage
              src="https://stgsfcc.sotbella.com/on/demandware.static/-/Sites-sotbella_uae-Library/default/sotbella-logo.png"
              alt="Sotbella Logo"
              my={4}
              w={{ base: "180px", xl: ["15vw", null, null, null, "11vw"] }}
              loading="lazy"
            />
          </Flex>
        ) : (
          <LogoNavbar />
        )}

        <CartQuickView />
        {isHidden ? (null) : (
          <Box h="70px" />
        )}

        {isHidden ? (
          <Flex
            w="100%"
            px={{ base: "12px", md: "50px" }}
            gap={4}
          >
            <strong>UNMUTED COLLECTION</strong>
            <p> (Early Access)</p>
          </Flex>
        ) : (
          <Container
            maxW="full"
            px={{ base: "12px", md: "50px" }}
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
                  {finalCategoryInfo.name}
                </Text>
              </BreadcrumbItem>
            </Breadcrumb>
          </Container>
        )}

        {showFilters && (
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
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            onApply={(payload) => {
              setSelectedCategories(payload.categories || []);
              setSelectedColors(payload.colors || []);
              setSelectedMaterials(payload.materials || []);
              setSelectedSizes(payload.sizes || []);
              if (payload.price) setPriceRange(payload.price);
              setSelectedSort(payload.sort || "");
              setFiltersApplied(true);
            }}
            filtersApplied={filtersApplied}
            onClearAll={handleClearAllFromDrawer}
            isHidden={isHidden}
          />
        )}

        <Box position="relative">
          {/* 1) First load shimmer (ONLY shimmer) */}
          {loading && products.length === 0 ? (
            <Box px={{ base: "12px", md: "50px" }}>
              {activeView === "grid" ? (
                <ShimmerGridProducts count={PAGE_SIZE} />
              ) : (
                <ShimmerProducts count={PAGE_SIZE} />
              )}
            </Box>
          ) : null}

          {/* 2) Empty state (ONLY empty) */}
          {!loading && initialFetchDone && products.length === 0 ? (
            <Box h="70vh">
              <Center h="100%">
                <Text fontSize="sm" color="gray.600" textAlign="center">
                  No products found in this selection.
                  <br />
                  Explore our latest arrivals and find something perfect for
                  you.
                </Text>
              </Center>
            </Box>
          ) : null}

          {/* 3) Listings (ONLY when products exist) */}
          {products.length > 0 ? (
            <>
              {activeView === "simple" && (
                <ChakraProductListingSimple
                  collectionPoduct={updatedProducts}
                  loading={false}
                  setOpenSizeGuide={onSizeGuideOpen}
                  isActive={true}
                  fromCollection={fromCategory}
                  sortBy={selectedSort}
                  categoryId={sfccCategoryId}
                  currentPage={currentPage}
                  categoryQueryKey={queryKey}
                  isHidden={isHidden}
                  campaignProducts={campaignProducts?.data || []}
                />
              )}

              {activeView === "zigzag" && (
                <ChakraProductListingZigZag
                  collectionPoduct={updatedProducts}
                  loading={false}
                  setOpenSizeGuide={onSizeGuideOpen}
                  isActive={true}
                  fromCollection={fromCategory}
                  sortBy={selectedSort}
                  categoryId={sfccCategoryId}
                  currentPage={currentPage}
                  categoryQueryKey={queryKey}
                  isHidden={isHidden}
                  campaignProducts={campaignProducts?.data || []}
                />
              )}

              {activeView === "grid" && (
                <ChakraProductListingGrid
                  collectionPoduct={updatedProducts}
                  loading={false}
                  setOpenSizeGuide={onSizeGuideOpen}
                  isActive={true}
                  fromCollection={fromCategory}
                  sortBy={selectedSort}
                  categoryId={sfccCategoryId}
                  currentPage={currentPage}
                  categoryQueryKey={queryKey}
                  isHidden={isHidden}
                  campaignProducts={campaignProducts?.data || []}
                />
              )}
            </>
          ) : null}

          {/* 4) Observer + fetching shimmer only when products exist */}
          {products.length >= PAGE_SIZE && hasMore && (
            <Box ref={observerRef} h="10px" bg="transparent" />
          )}

          {isFetchingMore && products.length > 0 && (
            <Box py={1} px={{ base: "12px", md: "50px" }}>
              {activeView === "grid" ? (
                <ShimmerGridProducts count={4} />
              ) : (
                <ShimmerProducts count={4} />
              )}
            </Box>
          )}
        </Box>

        {isHidden ? null : <Footer />}
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

export default CategoryPage;
