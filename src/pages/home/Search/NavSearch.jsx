import React, { Fragment, useState, useEffect, useRef, useMemo } from "react";
import { Box, Center, Text } from "@chakra-ui/react";
import { useParams, useSearchParams } from "react-router-dom";

import SearchBox from "./SearchBox";
import { searchProductsByQuery } from "@/api/services/enhancedProductSearch";
import { getSearchRefinements } from "@/api/services/sfccSearchService";
import {
  transformSFCCProduct,
  transformSFCCRefinements,
  buildRefinements,
} from "@/utils/sfccProductTransform";

import { useMobile } from "@/components/molecules";
import ChakraProductListingGrid from "@/components/common/ChakraProductListingGrid";
import ChakraProductListingZigZag from "@/components/common/ChakraProductListingZigZag";
import ChakraProductListingSimple from "@/components/common/ChakraProductListingSimple";
import SizeChartPopup from "@/pages/ProductDetails/components/SizeChartPopup";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";
import { ShimmerProducts } from "@/components/layouts";
import ChakraFilterSection from "@/components/common/ChakraFilterSection";
import ShimmerGridProducts from "@/components/layouts/Simmers/ShimmerGridProducts";
// import { getCurrentSiteId } from "@/utils/sfccSiteConfig";
import { trackSearch } from "@/utils/dataLayer";
import { trackViewSearch } from "@/api/services/einsteinTracking";
import SimilarProductsCrosssale from "@/pages/ProductDetails/components/SimilarProductsCrosssale";
import TrendingProducts from "@/pages/ProductDetails/components/TrendingProducts";
import RecentlyViewedProducts from "@/pages/ProductDetails/components/RecentlyViewedProducts";

/* ------------------- URL helpers ------------------- */
const toCSV = (arr = []) => arr.map(encodeURIComponent).join(",");
const fromCSV = (str = "") =>
  String(str)
    .split(",")
    .map((s) => decodeURIComponent(s))
    .map((s) => s.trim())
    .filter(Boolean);

const parsePrice = (p) => {
  if (!p) return null;
  const [min, max] = String(p).split(",").map((x) => Number(x));
  if (Number.isFinite(min) && Number.isFinite(max)) return { min, max };
  return null;
};

/* -------------------- Cache helpers (Search) -------------------- */
const CACHE_VERSION = "v1";
const SS_KEY = `NavSearchCache:${CACHE_VERSION}`;

// same marker keys used by your PDP logic
const BACK_MARK = "__BACK_FROM_PDP__";
const BACK_QUERYKEY = "__BACK_FROM_PDP_QUERYKEY__";
const BACK_SCROLLY = "__BACK_FROM_PDP_SCROLLY__";
const BACK_PAGE = "__BACK_FROM_PDP_PAGE__";

const PRODUCTS_TTL_MS = 15 * 60 * 1000;
const now = () => Date.now();

const memoryCache = {
  productsByQuery: new Map(), // queryKey -> { pages: Map(page->payload), meta, ts }
};

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
  if (!ss?.productsByQuery) return;

  Object.entries(ss.productsByQuery).forEach(([k, v]) => {
    const pagesMap = new Map();
    if (v.pages) {
      Object.entries(v.pages).forEach(([pageStr, payload]) => {
        pagesMap.set(Number(pageStr), payload);
      });
    }
    memoryCache.productsByQuery.set(k, { ...v, pages: pagesMap });
  });
};

const persistToSession = () => {
  const productsObj = {};
  memoryCache.productsByQuery.forEach((v, k) => {
    const pagesObj = {};
    v.pages?.forEach((payload, page) => {
      pagesObj[String(page)] = payload;
    });
    productsObj[k] = { ...v, pages: pagesObj };
  });
  saveSessionCache({ productsByQuery: productsObj });
};

if (typeof window !== "undefined") {
  hydrateFromSession();
}

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

const getCachedPage = (qKey, page) => {
  const q = memoryCache.productsByQuery.get(qKey);
  if (!q) return null;
  if (now() - (q.ts || 0) > PRODUCTS_TTL_MS) return null;
  return q.pages?.get(page) || null;
};

const setCachedPage = (qKey, page, payload, meta) => {
  const existing = memoryCache.productsByQuery.get(qKey);
  const pages = existing?.pages ? new Map(existing.pages) : new Map();
  pages.set(page, payload);

  memoryCache.productsByQuery.set(qKey, {
    pages,
    meta: meta || existing?.meta || {},
    ts: now(),
  });

  persistToSession();
};

const getMaxCachedPageForQuery = (qKey) => {
  const q = memoryCache.productsByQuery.get(qKey);
  const keys = q?.pages ? Array.from(q.pages.keys()) : [];
  if (!keys.length) return 0;
  return Math.max(...keys);
};

/* ------------------- Component ------------------- */
const NavSearch = () => {
  const [search, setSearch] = useState("");
  const [searchProduct, setSearchProduct] = useState([]);

  const [page, setPage] = useState(1);
  const [totalPageCount, setTotalPageCount] = useState(null);

  const [loading, setLoading] = useState(false);
  const [openSizeGuide, setOpenSizeGuide] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [activeView, setActiveView] = useState("simple");
  const { pathname } = window.location;

  const params = new URLSearchParams(window.location.search);
  
  const category = params.get("search");
  params.delete("search");
  
  const fullQuery = `?${params.toString()}`;
  
  const { isExchange, orderId, itemId, actionType } =
    Object.fromEntries(new URLSearchParams(fullQuery));
  
  console.log({
    pathname,
    fullQuery,
    category,
    isExchange,
    orderId,
    itemId,
    actionType,
  });

  useEffect(() => {
    const storedView = sessionStorage.getItem('activeView');
    if (storedView) {
      setActiveView(storedView);
    }
  }, []);

  useEffect(() => {
    sessionStorage.setItem('activeView', activeView);
  }, [activeView]);

  const isMobile = useMobile();
  const observerRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isHydrated, setIsHydrated] = useState(false);

  // Dynamic filter and sorting state
  const [filterData, setFilterData] = useState({
    categories: [],
    colors: [],
    materials: [],
    sizes: [],
    price: null,
  });

  const [sortingOptions, setSortingOptions] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedSort, setSelectedSort] = useState("");

  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [priceChange, setPriceChange] = useState([0, 0]);

  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [query, setQuery] = useState(searchParams.get("search") || "");

  // suggestions
  const [suggestions, setSuggestions] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // refinements update control
  const shouldUpdateFiltersRef = useRef(false);

  // ignore stale fetches
  const searchRequestId = useRef(0);

  // baseline price
  const basePriceRef = useRef(null);

  // back-restore flag
  const backRestorePendingRef = useRef(false);

  // while restoring, block infinite scroll + block accidental fetches
  const restoringRef = useRef(false);

  // skip next fetch flag (optimization)
  const skipNextFetchRef = useRef(false);


  // compute siteId once
  const siteId = import.meta.env.VITE_SFCC_SITE_ID;

  // Map picked UI names -> facet ids from filterList
  const pickIds = (picked = [], list = []) =>
    Array.isArray(picked) && Array.isArray(list)
      ? picked.map((n) => list.find((o) => o?.name === n)?.id ?? n)
      : picked || [];

  /* -------- searchQueryKey (MUST be in component scope) -------- */
  const refinementsPayload = useMemo(() => {
    const basePrice = basePriceRef.current || filterData?.price;

    const priceDefault =
      basePrice &&
      priceRange.min === basePrice.min &&
      priceRange.max === basePrice.max;

    return buildRefinements({
      categories: pickIds(selectedCategories, filterData.categories),
      colors: pickIds(selectedColors, filterData.colors),
      materials: pickIds(selectedMaterials, filterData.materials),
      sizes: pickIds(selectedSizes, filterData.sizes),
      priceRange: !priceDefault ? priceRange : null,
    });
  }, [
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange?.min,
    priceRange?.max,
    filterData?.categories,
    filterData?.colors,
    filterData?.materials,
    filterData?.sizes,
    filterData?.price?.min,
    filterData?.price?.max,
  ]);

  const searchQueryKey = useMemo(() => {
    return [
      "q",
      (query || "").trim(),
      "sort",
      selectedSort || "",
      "filters",
      stableStringify(refinementsPayload),
    ].join("|");
  }, [query, selectedSort, refinementsPayload]);

  /* ------------------- Basic URL sync ------------------- */

  // Reset page on param change
  useEffect(() => {
    setPage(1);
  }, [searchParams]);

  // Trigger search when searchTrigger changes
  useEffect(() => {
    if (searchTrigger > 0) {
      // setSearchParams({ search });
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (search && search.trim()) params.set("search", search);
        else params.delete("search");
        return params;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger]);

  console.log(searchParams.toString());
  // Track search query changes from URL
  useEffect(() => {
    console.log("URL search param changed:", searchParams.get("search"));
    const searchQuery = searchParams.get("search") || "";
    console.log("Extracted search query:", searchQuery);
    setQuery(searchQuery);
    setHasSearched(Boolean(searchQuery));
    setSearch(searchQuery);
  }, [searchParams]);

  // Reset baseline + hydration on new query
  useEffect(() => {
    setIsHydrated(false);
    basePriceRef.current = null;
  }, [query]);

  /* ------------------- Fetching ------------------- */

  const fetchFilterData = async ({ silent = false, skipProductsHydrate = false } = {}) => {
    if (!query) return;

    try {
      if (!silent) setLoading(true);

      const PAGE_SIZE = 12;

      const hitsRes = await searchProductsByQuery(query, { limit: PAGE_SIZE, offset: 0, siteId });
      const refinementsRes = hitsRes?.refinements || [];

      const transformedFilters = transformSFCCRefinements(
        refinementsRes || [],
        hitsRes?.hits || []
      );

      setFilterData(transformedFilters);

      // baseline price set once
      if (
        transformedFilters.price?.min !== undefined &&
        transformedFilters.price?.max !== undefined
      ) {
        if (!basePriceRef.current) basePriceRef.current = { ...transformedFilters.price };

        const priceFromUrl = parsePrice(searchParams.get("price"));
        const base = basePriceRef.current;

        if (priceFromUrl) {
          setPriceRange(priceFromUrl);
          setPriceChange([priceFromUrl.min, priceFromUrl.max]);
        } else if (base) {
          setPriceRange(base);
          setPriceChange([base.min, base.max]);
        }
      }

      // sorting options
      const apiSortingOptions = refinementsRes?.sortingOptions || hitsRes?.sortingOptions || [];
      const dynamicSortingOptions = apiSortingOptions.map((option) => ({
        id: option.id,
        name: option.label || option.name || option.id,
      }));
      setSortingOptions(dynamicSortingOptions);

      if (dynamicSortingOptions.length > 0 && !dynamicSortingOptions.some((o) => o.id === selectedSort)) {
        setSelectedSort("");
      }

      // ✅ IMPORTANT: Back restore mode me products ko touch nahi karna
      if (skipProductsHydrate) {
        if (!silent) setLoading(false);
        return;
      }

      // (optional optimization stays same)
      const hasActiveFilters =
        searchParams.has("cat") ||
        searchParams.has("color") ||
        searchParams.has("mat") ||
        searchParams.has("size") ||
        searchParams.has("price") ||
        searchParams.has("sort");

      if (!hasActiveFilters && hitsRes?.hits) {
        const products = hitsRes.hits.map(transformSFCCProduct);
        const total = Number(hitsRes.total || 0);
        const pages = Math.ceil(total / PAGE_SIZE);
        const initialPageProducts = products.slice(0, PAGE_SIZE);

        setSearchProduct(initialPageProducts);
        setTotalProducts(total);
        setTotalPages(pages);
        setTotalPageCount(pages);
        setCurrentPage(1);
        setPage(2);

        setCachedPage(searchQueryKey, 1, { items: initialPageProducts, total, pages }, { query });
        skipNextFetchRef.current = true;

        if (!silent) setLoading(false);
      } else {
        if (!silent) setLoading(false);
      }
    } catch (e) {
      if (!silent) setLoading(false);
      setIsHydrated(false);
    }
  };

  const getSearchProduct = async (pageNumber, options = { preferCache: false }) => {
    const preferCache = Boolean(options?.preferCache);

    // ✅ Serve cache
    if (preferCache) {
      const cached = getCachedPage(searchQueryKey, pageNumber);
      if (cached) {
        const { items, total, pages } = cached;

        setSearchProduct((prev) =>
          pageNumber === 1 ? items : [...prev, ...items]
        );

        setTotalProducts(total);
        setTotalPages(pages);
        setTotalPageCount(pages);
        setCurrentPage(pageNumber);
        setPage(pageNumber + 1);
        setLoading(false);
        return;
      }
    }

    const currentRequestId = ++searchRequestId.current;
    setLoading(true);

    try {
      const basePrice = basePriceRef.current || filterData?.price;

      const priceDefault =
        basePrice &&
        priceRange.min === basePrice.min &&
        priceRange.max === basePrice.max;

      const refinements = buildRefinements({
        categories: pickIds(selectedCategories, filterData.categories),
        colors: pickIds(selectedColors, filterData.colors),
        materials: pickIds(selectedMaterials, filterData.materials),
        sizes: pickIds(selectedSizes, filterData.sizes),
        priceRange: !priceDefault ? priceRange : null,
      });

      const PAGE_SIZE = 12;

      const response = await searchProductsByQuery(query, {
        limit: PAGE_SIZE,
        offset: (pageNumber - 1) * PAGE_SIZE,
        filters: refinements,
        sort: selectedSort,
        siteId,
      });

      if (currentRequestId !== searchRequestId.current) return;

      const products = response?.hits?.map(transformSFCCProduct) || [];
      const total = Number(response?.total || 0);
      const pages = Math.ceil(total / PAGE_SIZE);

      // ✅ Cache write (important!)
      setCachedPage(searchQueryKey, pageNumber, { items: products, total, pages }, { query });

      setTotalPageCount(pages);
      setTotalProducts(total);
      setTotalPages(pages);
      setCurrentPage(pageNumber);

      setSearchProduct((prev) =>
        pageNumber === 1 ? products : [...prev, ...products]
      );

      setPage(pageNumber + 1);

      // Track search event only on first page
      if (pageNumber === 1 && query) {
        trackSearch(query);

        const sortingRule = selectedSort
          ? [
            {
              attribute: selectedSort.includes("price") ? "price" : "relevance",
              direction: selectedSort.includes("desc") ? "descending" : "ascending",
            },
          ]
          : null;

        const itemRange = { start: (pageNumber - 1) * PAGE_SIZE };

        trackViewSearch(
          query,
          products.map((p) => ({ id: p.id || p.productId })),
          sortingRule,
          itemRange
        );
      }

      // Optionally update filters from response
      if (pageNumber === 1 && response.refinements && shouldUpdateFiltersRef.current) {
        const transformedFilters = transformSFCCRefinements(
          response.refinements || [],
          response.hits || []
        );

        const hasChanges =
          JSON.stringify(transformedFilters) !== JSON.stringify(filterData);

        if (hasChanges) {
          setFilterData(transformedFilters);
        }

        shouldUpdateFiltersRef.current = false;
      }
    } catch (error) {
      // optionally toast/log
    } finally {
      if (currentRequestId === searchRequestId.current) {
        setLoading(false);
      }
    }
  };

  // when query changes: fetch filters; do not double-fetch products
  useEffect(() => {
    if (!query) {
      setSearchProduct([]);
      setLoading(false);
      return;
    }

    const backFlag = sessionStorage.getItem(BACK_MARK) === "1";
    const backQ = sessionStorage.getItem(BACK_QUERYKEY) || "";

    // ✅ Back from PDP: list ko touch nahi karna, sirf filters hydrate karna
    if (backFlag && (!backQ || backQ === searchQueryKey)) {
      fetchFilterData({ silent: true, skipProductsHydrate: true });
      return;
    }

    // normal flow
    setLoading(true);
    shouldUpdateFiltersRef.current = false;
    setSearchProduct([]);
    setPage(1);
    setCurrentPage(1);
    fetchFilterData({ silent: false, skipProductsHydrate: false });

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, siteId, searchQueryKey]);

  /* ------------------- URL updating (NO hooks here) ------------------- */
  const updateURL = () => {
    const params = new URLSearchParams(searchParams);

    if (query && query.trim()) params.set("search", query.trim());
    else params.delete("search");

    if (selectedCategories?.length) params.set("cat", toCSV(selectedCategories));
    else params.delete("cat");

    if (selectedColors?.length) params.set("color", toCSV(selectedColors));
    else params.delete("color");

    if (selectedMaterials?.length) params.set("mat", toCSV(selectedMaterials));
    else params.delete("mat");

    if (selectedSizes?.length) params.set("size", toCSV(selectedSizes));
    else params.delete("size");

    // price only if changed from baseline
    const basePrice = basePriceRef.current || filterData?.price;
    const priceDefault =
      basePrice &&
      priceRange.min === basePrice.min &&
      priceRange.max === basePrice.max;

    if (!priceDefault) params.set("price", `${priceRange.min},${priceRange.max}`);
    else params.delete("price");

    if (selectedSort) params.set("sort", selectedSort);
    else params.delete("sort");

    setSearchParams(params, { replace: true });
  };

  /* ------------------- Back restore (products + scroll) ------------------- */
  useEffect(() => {
    if (!query) return;

    backRestorePendingRef.current = false;
    restoringRef.current = false;

    const backFlag = sessionStorage.getItem(BACK_MARK) === "1";
    const backQ = sessionStorage.getItem(BACK_QUERYKEY) || "";

    if (backFlag && (!backQ || backQ === searchQueryKey)) {
      backRestorePendingRef.current = true;
      restoringRef.current = true; // ✅ start restore mode
    }

    if (!backRestorePendingRef.current) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }

    // ✅ restore pages safely (cap to cached pages)
    const backPageRaw = Number(sessionStorage.getItem(BACK_PAGE) || 1);
    const maxCached = getMaxCachedPageForQuery(searchQueryKey);

    // If BACK_PAGE missing, restore all cached
    const restoreTo =
      backPageRaw > 0 ? Math.min(maxCached || 1, backPageRaw) : (maxCached || 1);

    let merged = [];
    let total = 0;
    let pages = 1;
    let lastPageLoaded = 0;

    for (let p = 1; p <= restoreTo; p++) {
      const cached = getCachedPage(searchQueryKey, p);
      if (!cached?.items?.length) break;
      merged = merged.concat(cached.items);
      total = cached.total || total;
      pages = cached.pages || pages;
      lastPageLoaded = p;
    }

    if (merged.length) {
      setSearchProduct(merged);
      setTotalProducts(total);
      setTotalPages(pages);
      setTotalPageCount(pages);
      setCurrentPage(lastPageLoaded);
      setPage(lastPageLoaded + 1);
      setLoading(false);
    } else {
      // if cache not available, fall back to API (normal flow will handle)
      restoringRef.current = false;
      backRestorePendingRef.current = false;
    }
  }, [query, searchQueryKey]);


  useEffect(() => {
    if (!backRestorePendingRef.current) return;
    if (!searchProduct?.length) return;

    const y = Number(sessionStorage.getItem(BACK_SCROLLY) || 0);
    if (!Number.isFinite(y) || y <= 0) {
      // cleanup anyway
      sessionStorage.removeItem(BACK_MARK);
      sessionStorage.removeItem(BACK_QUERYKEY);
      sessionStorage.removeItem(BACK_SCROLLY);
      sessionStorage.removeItem(BACK_PAGE);
      restoringRef.current = false;
      backRestorePendingRef.current = false;
      return;
    }

    let cancelled = false;

    const finish = () => {
      sessionStorage.removeItem(BACK_MARK);
      sessionStorage.removeItem(BACK_QUERYKEY);
      sessionStorage.removeItem(BACK_SCROLLY);
      sessionStorage.removeItem(BACK_PAGE);

      restoringRef.current = false;
      backRestorePendingRef.current = false;
    };

    // ✅ Wait until document has enough height to scroll to y
    const tryScroll = (attempt = 0) => {
      if (cancelled) return;

      const doc = document.documentElement;
      const maxScrollTop = doc.scrollHeight - window.innerHeight;

      // content ready if y is within possible scroll range (or close)
      const ready = maxScrollTop >= (y - 50);

      if (ready || attempt >= 25) {
        window.scrollTo({ top: Math.min(y, Math.max(0, maxScrollTop)), behavior: "auto" });
        finish();
        return;
      }

      // wait a bit (images/layout settle)
      requestAnimationFrame(() => {
        setTimeout(() => tryScroll(attempt + 1), 50);
      });
    };

    tryScroll(0);

    return () => {
      cancelled = true;
    };
  }, [searchProduct?.length]);

  /* ------------------- Apply URL when filters change ------------------- */
  useEffect(() => {
    if (!isHydrated) return;
    updateURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange?.min,
    priceRange?.max,
    selectedSort,
  ]);

  // Fetch first page when any filter/sort changes
  useEffect(() => {
    if (!query || !isHydrated) return;

    // ✅ restore ke time pe API call mat karo
    if (restoringRef.current || backRestorePendingRef.current) return;

    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    shouldUpdateFiltersRef.current = true;
    setCurrentPage(1);
    setPage(1);
    setLoading(true);
    getSearchProduct(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isHydrated,
    selectedCategories,
    selectedColors,
    selectedMaterials,
    selectedSizes,
    priceRange?.min,
    priceRange?.max,
    selectedSort,
  ]);

  /* ------------------- Infinite scroll ------------------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (restoringRef.current) return; // ✅ IMPORTANT
        if (entries[0].isIntersecting && !loading && page <= (totalPageCount || 0)) {
          getSearchProduct(page);
        }
      },
      { threshold: 1 }
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) observer.observe(currentObserverRef);

    return () => {
      if (currentObserverRef) observer.unobserve(currentObserverRef);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, page, totalPageCount, siteId]);

  /* ------------------- Search handlers ------------------- */
  const handleSearch = (explicitTerm) => {
    console.log(explicitTerm, search);
    const term = typeof explicitTerm === "string" ? explicitTerm : search;

    if ((term || "").trim() === (query || "").trim()) return;

    setLoading(true);

    if (typeof explicitTerm === "string") {
      setSearch(explicitTerm);
      // setSearchParams({ search: explicitTerm.trim() });
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        if (explicitTerm?.trim()) {
          params.set("search", explicitTerm.trim());
        } else {
          params.delete("search");
        }
        return params;
      });
    } else {
      setSearchTrigger((prev) => prev + 1);
    }
  };

  const handleSuggestionsChange = (suggestionsData, show) => {
    console.log("Suggestions updated:", suggestionsData, "Show:", show);
    setSuggestions(suggestionsData);
    setShowSuggestions(show);
  };

  const handleSuggestionClick = (suggestion) => {
    console.log("Suggestion clicked:", suggestion);
    setSearch(suggestion);
    setShowSuggestions(false);

    if ((suggestion || "").trim() === (query || "").trim()) return;

    handleSearch();
  };

  const handleClearAllFromDrawer = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
    setSelectedSort("");

    const base = basePriceRef.current || filterData?.price || { min: 0, max: 0 };
    setPriceRange(base);
    setPriceChange([base.min, base.max]);

    const params = new URLSearchParams(searchParams);
    params.delete("cat");
    params.delete("color");
    params.delete("mat");
    params.delete("size");
    params.delete("price");
    params.delete("sort");
    setSearchParams(params, { replace: true });
  };

  /* ------------------- Hydrate from URL after filters ready ------------------- */
  useEffect(() => {
    const priceBounds = filterData?.price;
    if (!priceBounds || priceBounds.min == null || priceBounds.max == null) return;

    const cat = fromCSV(searchParams.get("cat") || "");
    const color = fromCSV(searchParams.get("color") || "");
    const mat = fromCSV(searchParams.get("mat") || "");
    const size = fromCSV(searchParams.get("size") || "");
    const sort = searchParams.get("sort") || "";
    const priceFromUrl = parsePrice(searchParams.get("price"));

    setSelectedCategories(cat);
    setSelectedColors(color);
    setSelectedMaterials(mat);
    setSelectedSizes(size);
    setSelectedSort(sort);

    if (!basePriceRef.current) {
      basePriceRef.current = { ...priceBounds };
    }

    const base = basePriceRef.current;

    if (priceFromUrl) {
      setPriceRange(priceFromUrl);
      setPriceChange([priceFromUrl.min, priceFromUrl.max]);
    } else {
      setPriceRange(base);
      setPriceChange([base.min, base.max]);
    }

    setIsHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterData?.price?.min, filterData?.price?.max]);

  const filtersReady =
    !!filterData?.price &&
    (filterData.categories?.length ||
      filterData.colors?.length ||
      filterData.materials?.length ||
      filterData.sizes?.length);

// console.log(suggestions, showSuggestions, search, query);
  return (
    <Fragment>
      <Box>
        <LogoNavbar />
        <CartQuickView />

        <SearchBox
          searchProduct={searchProduct}
          loading={loading}
          setSearch={setSearch}
          search={search}
          handleSearch={handleSearch}
          onSuggestionsChange={handleSuggestionsChange}
          onSuggestionClick={handleSuggestionClick}
          suggestions={suggestions}
          showSuggestions={showSuggestions}
        />

        {hasSearched && filtersReady && (
          <ChakraFilterSection
            filterList={filterData}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedColor={selectedColors}
            setSelectedColor={setSelectedColors}
            selectedMaterial={selectedMaterials}
            setSelectedMaterial={setSelectedMaterials}
            selectedSize={selectedSizes}
            setSelectedSize={setSelectedSizes}
            selectedSort={selectedSort}
            setSelectedSort={setSelectedSort}
            sortingOptions={sortingOptions}
            priceRange={priceRange}
            setPriceChange={setPriceChange}
            onApply={(payload) => {
              setSelectedCategories(payload.categories || []);
              setSelectedColors(payload.colors || []);
              setSelectedMaterials(payload.materials || []);
              setSelectedSizes(payload.sizes || []);
              if (payload.price) setPriceRange(payload.price);
              setSelectedSort(payload.sort || "");
            }}
            onClearAll={handleClearAllFromDrawer}
            searchText={query}
            hasSearched={true}
            onSuggest={(label) => {
              setSearch(label);
              setSearchTrigger((c) => c + 1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            activeView={activeView}
            setActiveView={setActiveView}
          />
        )}

        {loading && searchProduct.length === 0 ? (
          <Box mt={isMobile ? "85px" : "10px"} px={{ base: "12px", md: "50px" }}>
            {activeView === "grid" ? <ShimmerGridProducts count={8} /> : <ShimmerProducts />}
          </Box>
        ) : searchProduct?.length > 0 ? (
          <Box>
            <ChakraProductListingSimple
              collectionPoduct={searchProduct}
              observerRef={observerRef}
              loading={loading && searchProduct.length === 0}
              setOpenSizeGuide={setOpenSizeGuide}
              isActive={activeView === "simple"}
              fromCollection={true}
              sortBy={selectedSort}
              searchText={query}
              searchQueryKey={searchQueryKey}
              currentPage={currentPage}
            />
            <ChakraProductListingZigZag
              collectionPoduct={searchProduct}
              observerRef={observerRef}
              loading={loading}
              setOpenSizeGuide={setOpenSizeGuide}
              isActive={activeView === "zigzag"}
              fromCollection={true}
              sortBy={selectedSort}
              searchText={query}
              searchQueryKey={searchQueryKey}
              currentPage={currentPage}
            />
            <ChakraProductListingGrid
              collectionPoduct={searchProduct}
              observerRef={observerRef}
              loading={loading}
              setOpenSizeGuide={setOpenSizeGuide}
              isActive={activeView === "grid"}
              fromCollection={true}
              sortBy={selectedSort}
              searchText={query}
              searchQueryKey={searchQueryKey}
              currentPage={currentPage}
            />
          </Box>
        ) : hasSearched ? (
          <Box h="40vh">
            <Center h="100%">
              <Text
                fontSize={{ base: "10px", md: "sm" }}
                color="blackAlpha.500"
                textAlign="center"
              >
                There are no products available for this selection.
              </Text>
            </Center>
          </Box>
        ) : (
          <Box mt={2}>
            <Center h="100%">
              <Text
                fontSize={{ base: "10px", md: "sm" }}
                color="blackAlpha.500"
                textAlign="center"
              >
                Start typing to explore Sotbella’s curated collections.
              </Text>
            </Center>
          </Box>
        )}

        <Box ref={observerRef} h="10px" bg="transparent" />

        {loading && searchProduct.length > 0 &&
          (activeView === "grid" ? (
            <Box px={{ base: "12px", md: "50px" }}>
              <ShimmerGridProducts count={4} />
            </Box>
          ) : (
            <ShimmerProducts
              count={4}
              containerPx={{ base: "12px", md: "50px" }}
              itemHeight={{ base: "360px", md: "600px" }}
            />
          ))}

        {(!hasSearched || (!loading && searchProduct?.length === 0)) && (
          <>
            <TrendingProducts />
            <SimilarProductsCrosssale />
            <RecentlyViewedProducts />
          </>
        )}

        <Footer />

        <SizeChartPopup
          open={openSizeGuide}
          handleClose={() => setOpenSizeGuide(false)}
          product={{}}
          onComplete={(rec) => {
            setSelectedSizes((prev) => [...prev, rec?.recommendedSize]);
          }}
        />
      </Box>
    </Fragment>
  );
};

export default NavSearch;
