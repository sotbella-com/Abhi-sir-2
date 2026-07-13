import React, { Fragment, useState, useEffect, useRef } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  VStack,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Checkbox,
  Divider,
  Input,
  Collapse,
  useDisclosure,
  useBreakpointValue,
  InputGroup,
  InputLeftElement,
  Portal,
} from "@chakra-ui/react";
import { Link, useParams } from "react-router-dom";
import { useMobile } from "@/components/molecules";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { HiOutlineChevronDown } from "react-icons/hi2";
import {
  fetchMenuData,
  transformMenuData,
  getCategoryUrl,
} from "@/api/services/menuApi.js";
import {
  RangeSlider,
  RangeSliderTrack,
  RangeSliderFilledTrack,
  RangeSliderThumb,
} from "@chakra-ui/react";

// function SortDropdown({ isMobile, sortingOptions = [], selectOption, selectedSortLabel }) {
//   const [open, setOpen] = useState(false);
//   const ref = useRef(null);

//   // close when clicking outside
//   useEffect(() => {
//     const onDocClick = (e) => {
//       if (ref.current && !ref.current.contains(e.target)) setOpen(false);
//     };
//     document.addEventListener("mousedown", onDocClick);
//     return () => document.removeEventListener("mousedown", onDocClick);
//   }, []);

//   return (
//     <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
//       {/* Trigger */}
//       <button
//         onClick={() => setOpen((p) => !p)}
//         aria-haspopup="listbox"
//         aria-expanded={open}
//         style={{
//           background: "transparent",
//           border: "none",
//           padding: "6px 8px",
//           display: "inline-flex",
//           alignItems: "center",
//           gap: "6px",
//           fontSize: 14,
//           cursor: "pointer",
//         }}
//       >
//         {isMobile ? (
//           // mobile icon
//           <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
//             <path d="M2.66722 9.33398H5.61461C6.23468 9.33398 6.54471 9.33398 6.6273 9.52072C6.70989 9.70752 6.49892 9.93152 6.07699 10.3796L3.65183 12.9551C3.2299 13.4031 3.01893 13.6271 3.10152 13.8139C3.18411 14.0007 3.49414 14.0007 4.11421 14.0007H6.66722" stroke="black" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
//             <path d="M2.66722 6L4.07093 2.87018C4.33112 2.29006 4.46121 2 4.66722 2C4.87323 2 5.00332 2.29006 5.26351 2.87018L6.66722 6" stroke="black" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
//             <path d="M11.6672 13.3327V2.66602M11.6672 13.3327C11.2004 13.3327 10.3282 12.0031 10.0005 11.666M11.6672 13.3327C12.134 13.3327 13.0062 12.0031 13.3339 11.666" stroke="black" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" />
//           </svg>
//         ) : (
//           <Text fontWeight="normal">
//             {selectedSortLabel || "SORT BY"}
//           </Text>
//         )}
//         <FiChevronDown />
//       </button>

//       {/* List */}
//       {open && (
//         <div
//           role="listbox"
//           style={{
//             position: "absolute",
//             top: "100%",
//             left: 0,
//             marginTop: 4,
//             minWidth: 160,
//             background: "#fff",
//             border: "1px solid #e5e5e5",
//             borderRadius: 6,
//             boxShadow: "0 6px 20px rgba(0,0,0,.08)",
//             zIndex: 50,
//             overflow: "hidden",
//           }}
//         >
//           {sortingOptions.length ? (
//             sortingOptions.map((opt) => (
//               <div
//                 role="option"
//                 key={opt.id}
//                 onClick={() => {
//                   selectOption(opt);
//                   setOpen(false);
//                 }}
//                 style={{
//                   padding: "8px 12px",
//                   fontSize: 14,
//                   cursor: "pointer",
//                   whiteSpace: "nowrap",
//                 }}
//                 onMouseEnter={(e) => (e.currentTarget.style.background = "#f7f7f7")}
//                 onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
//               >
//                 {opt.name}
//               </div>
//             ))
//           ) : (
//             <div style={{ padding: "8px 12px", fontSize: 14, color: "#8a8a8a" }}>
//               No sorting options available
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

function SortDropdown({
  isMobile,
  sortingOptions = [],
  selectOption,
  selectedSortLabel,
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 160 });

  const updatePosition = () => {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();

    setPos({
      top: r.bottom + 6,
      left: r.left,
      width: Math.max(160, r.width),
    });
  };

  useEffect(() => {
    if (!open) return;

    const closeOnScroll = () => setOpen(false);

    window.addEventListener("scroll", closeOnScroll, true);
    window.addEventListener("wheel", closeOnScroll, { passive: true });
    window.addEventListener("touchmove", closeOnScroll, { passive: true });

    window.addEventListener("resize", closeOnScroll);

    return () => {
      window.removeEventListener("scroll", closeOnScroll, true);
      window.removeEventListener("wheel", closeOnScroll);
      window.removeEventListener("touchmove", closeOnScroll);
      window.removeEventListener("resize", closeOnScroll);
    };
  }, [open]);

  // close on outside click
  useEffect(() => {
    if (!open) return;

    const onDocDown = (e) => {
      const btn = btnRef.current;
      const menu = menuRef.current;
      if (btn && btn.contains(e.target)) return;
      if (menu && menu.contains(e.target)) return;
      setOpen(false);
    };

    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
  }, [open]);

  return (
    <div style={{ display: "inline-block" }}>
      {/* Trigger */}
      <button
        ref={btnRef}
        onClick={() => {
          setOpen((p) => {
            const next = !p;
            if (next) requestAnimationFrame(updatePosition);
            return next;
          });
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        style={{
          background: "transparent",
          border: "none",
          padding: "6px 8px",
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          fontSize: 14,
          cursor: "pointer",
        }}
      >
        {isMobile ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2.66722 9.33398H5.61461C6.23468 9.33398 6.54471 9.33398 6.6273 9.52072C6.70989 9.70752 6.49892 9.93152 6.07699 10.3796L3.65183 12.9551C3.2299 13.4031 3.01893 13.6271 3.10152 13.8139C3.18411 14.0007 3.49414 14.0007 4.11421 14.0007H6.66722"
              stroke="black"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2.66722 6L4.07093 2.87018C4.33112 2.29006 4.46121 2 4.66722 2C4.87323 2 5.00332 2.29006 5.26351 2.87018L6.66722 6"
              stroke="black"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M11.6672 13.3327V2.66602M11.6672 13.3327C11.2004 13.3327 10.3282 12.0031 10.0005 11.666M11.6672 13.3327C12.134 13.3327 13.0062 12.0031 13.3339 11.666"
              stroke="black"
              strokeWidth="0.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <span style={{ fontWeight: 400 }}>
            {selectedSortLabel || "SORT BY"}
          </span>
        )}
        <FiChevronDown />
      </button>

      {/* Menu in Portal (breaks stacking context issues) */}
      {open && (
        <Portal>
          <div
            ref={menuRef}
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              background: "#fff",
              border: "1px solid #e5e5e5",
              borderRadius: 6,
              boxShadow: "0 6px 20px rgba(0,0,0,.08)",
              zIndex: 100,
              overflow: "hidden",
              maxHeight: "60vh",
              overflowY: "auto",
            }}
          >
            {sortingOptions.length ? (
              sortingOptions.map((opt) => (
                <div
                  role="option"
                  key={opt.id}
                  onClick={() => {
                    selectOption(opt);
                    setOpen(false);
                  }}
                  style={{
                    padding: "10px 12px",
                    fontSize: 14,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f7f7f7")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  {opt.name}
                </div>
              ))
            ) : (
              <div
                style={{ padding: "10px 12px", fontSize: 14, color: "#8a8a8a" }}
              >
                No sorting options available
              </div>
            )}
          </div>
        </Portal>
      )}
    </div>
  );
}

const ChakraFilterSection = (props) => {
  const {
    filterList,
    selectedCategories,
    setSelectedCategories,
    setSelectedColor,
    setSelectedMaterial,
    selectedColor,
    selectedMaterial,
    selectedSize,
    setSelectedSize,
    setPriceChange,
    setSelectedSort,
    selectedSort,
    sortingOptions = [],
    activeView,
    setActiveView,
    onSuggest,
    searchText,
    priceRange,
    setPriceRange,
    onApply,
    filtersApplied = false,
    onClearAll,
    isHidden,
  } = props;

  const isMobile = useMobile();
  const dropdownRef = useRef(null);
  const showOnDesktop = useBreakpointValue({ base: false, md: true });
  const showOnMobile = useBreakpointValue({ base: true, md: false });

  /* ===== Top toolbar show/hide while scrolling ===== */
  const [showToolbar, setShowToolbar] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const IDLE_DELAY = 500;
  const hasSearched = !!(searchText && searchText.trim().length > 0);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 100);
      if (showToolbar) setShowToolbar(false);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(
        () => setShowToolbar(true),
        IDLE_DELAY,
      );
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [showToolbar]);

  /* ===== Drawer state ===== */
  const {
    isOpen: drawerOpen,
    onOpen: openDrawer,
    onClose: closeDrawer,
  } = useDisclosure();
  const [activeAccordion, setActiveAccordion] = useState(null);

  /* ===== Nested Category State ===== */
  const [expandedLevel2, setExpandedLevel2] = useState({});
  const toggleLevel2 = (id) =>
    setExpandedLevel2((p) => ({ ...p, [id]: !p[id] }));

  /* ===== Global Categories from Menu API ===== */
  const [globalCategories, setGlobalCategories] = useState({});
  const { categoryId } = useParams();

  useEffect(() => {
    const loadMenus = async () => {
      try {
        const apiData = await fetchMenuData();
        const transformed = transformMenuData(apiData);
        const categories = transformed || {};

        if (!categoryId) {
          setGlobalCategories(categories);
          return;
        }

        const normalizeId = (id) =>
          String(id || "")
            .replace(/[-_\s]/g, "")
            .toLowerCase();
        const currentSlugStr = normalizeId(categoryId);

        // Find the level 1 category that contains the current slug
        for (const key in categories) {
          const level1 = categories[key];
          let found = false;

          if (
            normalizeId(level1.id) === currentSlugStr ||
            normalizeId(level1.name) === currentSlugStr
          ) {
            found = true;
          }

          if (!found && level1.subcategories) {
            for (const level2 of level1.subcategories) {
              if (
                normalizeId(level2.id) === currentSlugStr ||
                normalizeId(level2.name) === currentSlugStr
              ) {
                found = true;
                break;
              }
              if (level2.categories) {
                for (const level3 of level2.categories) {
                  if (
                    normalizeId(level3.id) === currentSlugStr ||
                    normalizeId(level3.name) === currentSlugStr
                  ) {
                    found = true;
                    break;
                  }
                }
              }
              if (found) break;
            }
          }

          if (found) {
            setGlobalCategories({ [key]: level1 });
            // Expand parents by default
            if (level1.subcategories) {
              const opens = {};
              level1.subcategories.forEach((l2) => {
                let shouldOpen = false;
                // Active leaf check
                if (
                  normalizeId(l2.id) === currentSlugStr ||
                  normalizeId(l2.name) === currentSlugStr
                )
                  shouldOpen = true;
                if (l2.categories) {
                  l2.categories.forEach((l3) => {
                    if (
                      normalizeId(l3.id) === currentSlugStr ||
                      normalizeId(l3.name) === currentSlugStr
                    )
                      shouldOpen = true;
                  });
                }
                const l2Id =
                  l2.id || l2.name.replace(/\s+/g, "_").toLowerCase();
                if (shouldOpen) opens[l2Id] = true;
              });
              setExpandedLevel2(opens);
            }
            return;
          }
        }

        // Fallback: if not found in any subtree, just show all
        setGlobalCategories(categories);
      } catch (e) {
        // console.error("Failed to fetch menu data for filter", e);
      }
    };
    loadMenus();
  }, [categoryId]);

  /* ===== Local State for Deferred Apply ===== */
  const [localCategories, setLocalCategories] = useState([]);
  const [localColors, setLocalColors] = useState([]);
  const [localMaterials, setLocalMaterials] = useState([]);
  const [localSizes, setLocalSizes] = useState([]);

  // Sync local state with props when drawer opens
  useEffect(() => {
    if (drawerOpen) {
      setLocalCategories(selectedCategories || []);
      setLocalColors(selectedColor || []);
      setLocalMaterials(selectedMaterial || []);
      setLocalSizes(selectedSize || []);

      // Sync price range
      if (priceRange?.min !== undefined && priceRange?.max !== undefined) {
        setRange([priceRange.min, priceRange.max]);
      } else if (filterList?.price) {
        setRange([filterList.price.min, filterList.price.max]);
      }
    }
  }, [
    drawerOpen,
    selectedCategories,
    selectedColor,
    selectedMaterial,
    selectedSize,
    priceRange,
    filterList,
  ]);

  /* ===== Sort dropdown ===== */
  const [selectedSortLabel, setSelectedSortLabel] = useState(null);
  const selectOption = (option) => {
    if (typeof option === "string") {
      // Handle legacy string format
      setSelectedSort(option);
      setSelectedSortLabel(option);
    } else {
      // Handle new object format with id and name
      setSelectedSort(option.id);
      setSelectedSortLabel(option.name);
    }
  };

  useEffect(() => {
    const outside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        // Menu will handle its own closing
      }
    };
    document.addEventListener("click", outside);
    return () => document.removeEventListener("click", outside);
  }, []);

  useEffect(() => {
    if (!drawerOpen) {
      // reset visible slider to last applied priceRange
      if (priceRange?.min !== undefined && priceRange?.max !== undefined) {
        setRange([priceRange.min, priceRange.max]);
      }
    }
  }, [drawerOpen]);

  // order you want for alpha sizes
  const alphaOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "4XL", "5XL"];

  const isNumericSize = (s) => /^\d+(\.\d+)?$/.test(String(s).trim());

  const sizeRank = (name) => {
    const n = String(name).trim().toUpperCase();
    const alphaIdx = alphaOrder.indexOf(n);
    if (alphaIdx !== -1) return { group: 0, key: alphaIdx }; // alpha first in given order
    if (isNumericSize(n)) return { group: 1, key: parseFloat(n) }; // numbers next, ascending
    return { group: 2, key: n }; // anything else last, A→Z
  };

  const sortedSizes = [...(filterList?.sizes ?? [])].sort((a, b) => {
    const A = sizeRank(a.name);
    const B = sizeRank(b.name);
    return A.group !== B.group
      ? A.group - B.group
      : A.key > B.key
        ? 1
        : A.key < B.key
          ? -1
          : 0;
  });

  /* ===== Price range ===== */
  const [range, setRange] = useState([
    filterList?.price?.min || 0,
    filterList?.price?.max || 10000,
  ]);
  const [priceStep, setPriceStep] = useState(1);

  useEffect(() => {
    if (
      filterList?.price?.min !== undefined &&
      filterList?.price?.max !== undefined
    ) {
      const newStep = Math.round(
        (filterList.price.max - filterList.price.min) / 100,
      );
      setPriceStep(newStep > 0 ? newStep : 1);
      // setRange([filterList.price.min, filterList.price.max]); // Avoid resetting on every render unless props change meaningfully
      if (!drawerOpen) {
        setRange([filterList.price.min, filterList.price.max]);
      }
    }
  }, [filterList?.price?.min, filterList?.price?.max, drawerOpen]);

  // Initialize price range from props if available
  useEffect(() => {
    if (
      priceRange &&
      priceRange.min !== undefined &&
      priceRange.max !== undefined
    ) {
      if (!drawerOpen) {
        setRange([priceRange.min, priceRange.max]);
      }
    }
  }, [priceRange, drawerOpen]);

  const handlePriceChange = (value) => {
    setRange(value);
    // setPriceChange(value); // REMOVED: Deferred apply
  };

  /* ===== Checkbox handlers (Update Local State) ===== */
  const handleCheckboxChangeCategories = (name) => {
    setLocalCategories((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const handleCheckboxChangeColor = (name) => {
    setLocalColors((prev) =>
      prev?.includes(name)
        ? prev.filter((x) => x !== name)
        : [...(prev ?? []), name],
    );
  };

  const handleCheckboxChangeMaterial = (name) => {
    setLocalMaterials((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const handleCheckboxChangeSize = (name) => {
    setLocalSizes((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name],
    );
  };

  const toggleAccordion = (accordionName) => {
    setActiveAccordion(
      activeAccordion === accordionName ? null : accordionName,
    );
  };

  /* ===== Applied Filters helpers ===== */
  const formatCurrency = (n) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(n ?? 0);

  const appliedFilters = (() => {
    const chips = [];
    // Price chip if changed
    // Use props here because 'Applied Filters' strip is outside drawer and reflects current state
    if (
      filterList?.price &&
      (priceRange?.min !== filterList.price.min ||
        priceRange?.max !== filterList.price.max)
    ) {
      chips.push({
        type: "price",
        label: `${formatCurrency(priceRange?.min)} – ${formatCurrency(priceRange?.max)}`,
      });
    }
    selectedCategories?.forEach((name) =>
      chips.push({ type: "category", value: name, label: name }),
    );
    selectedColor?.forEach?.((name) =>
      chips.push({ type: "color", value: name, label: name }),
    );
    selectedMaterial?.forEach((name) =>
      chips.push({ type: "material", value: name, label: name }),
    );
    selectedSize?.forEach((name) =>
      chips.push({ type: "size", value: name, label: name }),
    );
    return chips;
  })();

  const removeChip = (chip) => {
    switch (chip.type) {
      case "price": {
        const min = filterList?.price?.min ?? 0;
        const max = filterList?.price?.max ?? 0;
        setRange([min, max]);
        // removal is immediate
        setPriceChange([min, max]);
        setPriceRange?.({ min, max });
        break;
      }
      case "category":
        setSelectedCategories((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "color":
        setSelectedColor((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "material":
        setSelectedMaterial((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "size":
        setSelectedSize((prev) => prev.filter((v) => v !== chip.value));
        break;
      default:
        break;
    }
  };

  const toInclusiveRange = ([min, max]) => {
    const safeMin = Math.max(0, Math.floor(Number(min ?? 0)));
    const safeMax = Math.ceil(Number(max ?? 0));

    return {
      min: Math.max(0, safeMin - 1),
      max: safeMax + 1,
    };
  };

  const handleApply = () => {
    const baseMin = filterList?.price?.min ?? 0;
    const baseMax = filterList?.price?.max ?? 0;

    const priceChanged = range?.[0] !== baseMin || range?.[1] !== baseMax;

    const inclusive = toInclusiveRange(range);

    // build payload with LOCAL state
    const payload = {
      categories: localCategories,
      colors: localColors,
      materials: localMaterials,
      sizes: localSizes,
      sort: selectedSort,
      ...(priceChanged
        ? { price: { min: inclusive.min, max: inclusive.max } }
        : {}),
    };

    const result = onApply?.(payload);
    if (result && typeof result.then === "function") {
      result.finally(() => closeDrawer());
      return;
    }
    closeDrawer();
  };

  const handleClearAll = () => {
    if (onClearAll) onClearAll();
    closeDrawer();
  };

  const clearAll = () => {
    const min = filterList?.price?.min ?? 0;
    const max = filterList?.price?.max ?? 0;
    setRange([min, max]);
    setLocalCategories([]);
    setLocalColors([]);
    setLocalMaterials([]);
    setLocalSizes([]);
  };

  const SUGGESTIONS = ["dresses", "party wear", "co-ord"];

  // Put this near the top of the file
  const SizeBox = ({ label, checked, onToggle }) => (
    <Box
      as="button"
      type="button"
      onClick={onToggle}
      border="1px solid"
      borderColor={"black"}
      px={2}
      py={1}
      _hover={{ bg: "transparent", borderColor: "black" }}
    >
      <HStack spacing={3}>
        {/* little checkbox square */}
        <Box
          w="12px"
          h="12px"
          border="1px solid"
          borderColor={"black"}
          bg={checked ? "black" : "transparent"}
          position="relative"
        >
          {checked && (
            <Box
              as="svg"
              viewBox="0 0 12 10"
              w="12px"
              h="10px"
              position="absolute"
              top="50%"
              left="50%"
              transform="translate(-50%, -50%)"
              fill="none"
              stroke="white"
              strokeWidth="2"
            >
              <path d="M1 5l3 3 7-7" />
            </Box>
          )}
        </Box>

        <Text fontSize="xs">{label}</Text>
      </HStack>
    </Box>
  );

  const blackSquareCheckboxSx = {
    ".chakra-checkbox__control": {
      w: "12px",
      h: "12px",
      borderRadius: "0",
      borderColor: "black",
      borderWidth: "1px",
      bg: "white",
      _checked: {
        bg: "black",
        borderColor: "black",
        color: "white",
        _hover: { bg: "black" },
      },
      _hover: { bg: "white" },
      _focus: { boxShadow: "none" },
    },
  };

  return (
    <Fragment>
      {/* ===== Sticky toolbar ===== */}
      <Box
        position={isScrolled ? "fixed" : "sticky"}
        top={{ base: "50px", md: "60px" }}
        zIndex={20}
        py={{ base: "5px", md: 2 }}
        w="full"
        transition="all 0.3s"
        // bg={isScrolled ? "whiteAlpha.200" : "transparent"}
        // backdropFilter={isScrolled ? "blur(2px)" : "none"}
        opacity={showToolbar ? 1 : 0}
        transform={showToolbar ? "translateY(0)" : "translateY(-100%)"}
        pointerEvents={showToolbar ? "auto" : "none"}
        willChange="transform, opacity"
      >
        <Box px={{ base: "12px", md: "50px" }}>
          <Flex justify="space-between" w="full">
            <HStack spacing={3}>
              {!isHidden && (
                <Button
                  onClick={openDrawer}
                  variant="ghost"
                  rightIcon={<HiOutlineChevronDown />}
                  fontSize="sm"
                  color="black"
                  fontWeight="normal"
                  px={0}
                  _hover={{
                    bg: "transparent",
                    _after: { transform: "scaleX(1)" },
                  }}
                >
                  FILTER
                </Button>
              )}
            </HStack>

            {/* Sort + view toggles */}
            <HStack>
              {/* Sort Dropdown */}
              <SortDropdown
                isMobile={isMobile}
                sortingOptions={sortingOptions}
                selectOption={selectOption}
                selectedSortLabel={selectedSortLabel}
              />

              {/* View toggle icons */}
              <HStack>
                {/* Desktop: 1) Simple */}
                <button
                  onClick={() => setActiveView("simple")}
                  style={{
                    display: showOnDesktop ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0",
                    cursor: "pointer",
                    opacity: activeView === "simple" ? 1 : 0.5,
                  }}
                  aria-label="Simple view"
                >
                  <svg width="16" height="18" viewBox="0 0 12 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="4.5"
                      height="14.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "simple" ? "currentColor" : "none"}
                    />
                    <rect
                      x="7.048"
                      y="0.75"
                      width="4.5"
                      height="14.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "simple" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>

                {/* Desktop: 2) ZigZag */}
                <button
                  onClick={() => setActiveView("zigzag")}
                  style={{
                    display: showOnDesktop ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0",
                    cursor: "pointer",
                    opacity: activeView === "zigzag" ? 1 : 0.5,
                  }}
                  aria-label="ZigZag view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                    <rect
                      x="1.048"
                      y="8.75"
                      width="14.5"
                      height="6.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                    <rect
                      x="9.447"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>

                {/* Desktop: 3) Grid */}
                <button
                  onClick={() => setActiveView("grid")}
                  style={{
                    display: showOnDesktop ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0",
                    cursor: "pointer",
                    opacity: activeView === "grid" ? 1 : 0.5,
                  }}
                  aria-label="Grid view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                    <rect
                      x="1.048"
                      y="9.15"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                    <rect
                      x="9.448"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                    <rect
                      x="9.448"
                      y="9.15"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>

                {/* Mobile: 1) Simple */}
                <button
                  onClick={() => setActiveView("simple")}
                  style={{
                    display: showOnMobile ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0 4px",
                    cursor: "pointer",
                    opacity: activeView === "simple" ? 1 : 0.5,
                  }}
                  aria-label="Simple view"
                >
                  <svg width="16" height="18" viewBox="0 0 12 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="10"
                      height="14.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "simple" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>

                {/* Mobile: 3) Grid */}
                <button
                  onClick={() => setActiveView("grid")}
                  style={{
                    display: showOnMobile ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0 4px",
                    cursor: "pointer",
                    opacity: activeView === "grid" ? 1 : 0.5,
                  }}
                  aria-label="Grid view"
                >
                  <svg width="16" height="18" viewBox="0 0 12 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="4.5"
                      height="14.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                    <rect
                      x="7.048"
                      y="0.75"
                      width="4.5"
                      height="14.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "grid" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>

                {/* Mobile: 2) ZigZag */}
                <button
                  onClick={() => setActiveView("zigzag")}
                  style={{
                    display: showOnMobile ? "inline-flex" : "none",
                    background: "transparent",
                    border: "none",
                    padding: "0",
                    margin: "0 4px",
                    cursor: "pointer",
                    opacity: activeView === "zigzag" ? 1 : 0.5,
                  }}
                  aria-label="ZigZag view"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect
                      x="1.048"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                    <rect
                      x="1.048"
                      y="8.75"
                      width="14.5"
                      height="6.5"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                    <rect
                      x="9.447"
                      y="0.75"
                      width="6.1"
                      height="6.1"
                      stroke="currentColor"
                      strokeWidth="0.5"
                      fill={activeView === "zigzag" ? "currentColor" : "none"}
                    />
                  </svg>
                </button>
              </HStack>
            </HStack>
          </Flex>
        </Box>
      </Box>

      {/* ===== Applied Filters Strip ===== */}
      {filtersApplied && appliedFilters.length > 0 && (
        <Box
          w="full"
          zIndex={19}
          bg="whiteAlpha.700"
          backdropFilter="blur(10px)"
          position="sticky"
          top={{ base: "90px", md: "98px" }}
          borderY="1px"
          borderColor="blackAlpha.100"
          mb={2}
        >
          <Box px={{ base: "12px", md: "50px" }}>
            <Flex flexWrap="wrap" align="center" gap={2} py={2}>
              {appliedFilters.map((chip, idx) => (
                <Button
                  key={`${chip.type}-${chip.value ?? "price"}-${idx}`}
                  onClick={() => removeChip(chip)}
                  size="sm"
                  variant="outline"
                  borderRadius="full"
                  h="32px"
                  fontSize="xs"
                  maxW="160px"
                  _hover={{ bg: "black", color: "white" }}
                >
                  <Text isTruncated>{chip.label}</Text>
                  <Box as="span" ml={2}>
                    <Box as="svg" w="12px" h="12px" viewBox="0 0 12 12">
                      <path
                        d="M3 3l6 6M9 3L3 9"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                    </Box>
                  </Box>
                </Button>
              ))}

              {/* Clear all */}
              <Button
                onClick={handleClearAll}
                variant="link"
                fontSize="11px"
                textDecoration="underline"
                textDecorationOffset={4}
                textDecorationColor="blackAlpha.500"
                _hover={{ textDecorationColor: "black" }}
                ml="auto"
              >
                Clear all
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* ===== Filter Drawer ===== */}
      <Drawer isOpen={drawerOpen} onClose={closeDrawer} placement="left">
        <DrawerOverlay />
        <DrawerContent maxW="350px" w="350px">
          <DrawerCloseButton _hover={{ bg: "transparent", color: "black" }} />
          <DrawerHeader>
            <Text fontSize="15px" fontWeight="semibold" letterSpacing="wide">
              FILTER
            </Text>
          </DrawerHeader>

          <DrawerBody
            px={2}
            display="flex"
            flexDirection="column"
            className="scrollbar-hide"
          >
            <VStack align="stretch" flex="1">
              {/* Price Range */}
              <Box>
                <Button
                  w="full"
                  justifyContent="space-between"
                  variant="ghost"
                  onClick={() => toggleAccordion("price")}
                  _hover={{ bg: "transparent" }}
                >
                  <Text fontSize="sm">PRICE</Text>
                  <Box
                    transform={
                      activeAccordion === "price"
                        ? "rotate(0deg)"
                        : "rotate(270deg)"
                    }
                    transition="transform 0.3s"
                  >
                    <Box
                      as="svg"
                      w="12px"
                      h="8px"
                      viewBox="0 0 12 8"
                      fill="none"
                    >
                      <path
                        d="M1 1L6 6L11 1"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </Box>
                  </Box>
                </Button>
                <Collapse in={activeAccordion === "price"}>
                  <Box py={4} px={6}>
                    <VStack spacing={4} align="stretch">
                      <RangeSlider
                        value={range}
                        onChange={handlePriceChange}
                        min={filterList?.price?.min ?? 0}
                        max={filterList?.price?.max ?? 10000}
                        step={priceStep}
                        w="full"
                      >
                        <RangeSliderTrack bg="blackAlpha.300" h="4px">
                          <RangeSliderFilledTrack bg="black" />
                        </RangeSliderTrack>

                        {/* left thumb */}
                        <RangeSliderThumb
                          index={0}
                          boxSize={4}
                          bg="black"
                          border="2px solid"
                          borderColor="black"
                          _focus={{ boxShadow: "none" }}
                          _active={{ boxShadow: "none" }}
                        />

                        {/* right thumb */}
                        <RangeSliderThumb
                          index={1}
                          boxSize={4}
                          bg="black"
                          border="2px solid"
                          borderColor="black"
                          _focus={{ boxShadow: "none" }}
                          _active={{ boxShadow: "none" }}
                        />
                      </RangeSlider>
                      <HStack spacing={2} w="full">
                        <InputGroup flex="1" size="sm">
                          <InputLeftElement pointerEvents="none">
                            <Text fontSize="xs" pl={8} whiteSpace="nowrap">
                              Min Price
                            </Text>
                          </InputLeftElement>
                          <Input
                            h="30px"
                            pr={2}
                            value={range[0]}
                            readOnly
                            textAlign="right"
                            borderColor="black"
                            fontSize="xs"
                            fontWeight="medium"
                            borderRadius="0"
                            _focus={{
                              boxShadow: "none",
                              borderColor: "gray.600",
                            }}
                          />
                        </InputGroup>
                        <Text>-</Text>

                        <InputGroup flex="1" size="sm">
                          <InputLeftElement pointerEvents="none">
                            <Text fontSize="xs" pl={8} whiteSpace="nowrap">
                              Max Price
                            </Text>
                          </InputLeftElement>
                          <Input
                            h="30px"
                            pr={2}
                            value={range[1]}
                            readOnly
                            textAlign="right"
                            borderColor="black"
                            fontSize="xs"
                            fontWeight="medium"
                            borderRadius="0"
                            _focus={{
                              boxShadow: "none",
                              borderColor: "gray.600",
                            }}
                          />
                        </InputGroup>
                      </HStack>
                    </VStack>
                  </Box>
                </Collapse>
              </Box>

              <Divider borderColor={"blackAlpha.300"} />

              {/* Categories */}
              {Object.keys(globalCategories).length > 0 && (
                <Box>
                  <Button
                    w="full"
                    justifyContent="space-between"
                    variant="ghost"
                    onClick={() => toggleAccordion("categories")}
                    _hover={{ bg: "transparent" }}
                  >
                    <Text fontSize="sm">CATEGORY</Text>
                    <Box
                      transform={
                        activeAccordion === "categories"
                          ? "rotate(0deg)"
                          : "rotate(270deg)"
                      }
                      transition="transform 0.3s"
                    >
                      <Box
                        as="svg"
                        w="12px"
                        h="8px"
                        viewBox="0 0 12 8"
                        fill="none"
                      >
                        <path
                          d="M1 1L6 6L11 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Box>
                    </Box>
                  </Button>
                  <Collapse in={activeAccordion === "categories"}>
                    <Box
                      p={4}
                      maxH="50vh"
                      overflowY="auto"
                      className="scrollbar-hide"
                    >
                      <VStack align="stretch" spacing={4}>
                        {Object.values(globalCategories).map((level1) => {
                          const lvl1Id =
                            level1.id ||
                            level1.name.replace(/\s+/g, "_").toLowerCase();
                          const normalizeId = (id) =>
                            String(id || "")
                              .replace(/[-_\s]/g, "")
                              .toLowerCase();
                          const isLevel1Active =
                            categoryId &&
                            normalizeId(lvl1Id) === normalizeId(categoryId);

                          return (
                            <Box key={lvl1Id}>
                              <Link
                                to={getCategoryUrl(lvl1Id)}
                                onClick={() => closeDrawer?.()}
                              >
                                <Text
                                  fontSize="xs"
                                  textTransform="uppercase"
                                  letterSpacing="wide"
                                  fontWeight="bold"
                                  color={isLevel1Active ? "black" : "gray.800"}
                                  textDecoration={
                                    isLevel1Active ? "underline" : "none"
                                  }
                                  mb={level1.subcategories?.length > 0 ? 2 : 0}
                                  _hover={{ opacity: 0.7 }}
                                  cursor="pointer"
                                  display="block"
                                >
                                  {level1.name}
                                </Text>
                              </Link>

                              {level1.subcategories?.length > 0 && (
                                <VStack
                                  align="stretch"
                                  spacing={2}
                                  pl={5}
                                  mt={1}
                                  borderLeft="1px solid"
                                  borderColor="blackAlpha.200"
                                >
                                  {level1.subcategories.map((level2) => {
                                    const lvl2Id =
                                      level2.id ||
                                      level2.name
                                        .replace(/\s+/g, "_")
                                        .toLowerCase();
                                    const isLevel2Active =
                                      categoryId &&
                                      normalizeId(lvl2Id) ===
                                        normalizeId(categoryId);
                                    const hasChildren =
                                      level2.categories?.length > 0;

                                    return (
                                      <Box key={lvl2Id}>
                                        {hasChildren ? (
                                          <Flex
                                            justify="space-between"
                                            align="center"
                                            onClick={() => toggleLevel2(lvl2Id)}
                                            cursor="pointer"
                                            _hover={{ opacity: 0.7 }}
                                            mb={expandedLevel2[lvl2Id] ? 2 : 0}
                                          >
                                            <Text
                                              fontSize="xs"
                                              textTransform="uppercase"
                                              letterSpacing="wide"
                                              color="gray.600"
                                              fontWeight="600"
                                            >
                                              {level2.name}
                                            </Text>
                                            <Box color="gray.500">
                                              {expandedLevel2[lvl2Id] ? (
                                                <FiChevronUp size={14} />
                                              ) : (
                                                <FiChevronDown size={14} />
                                              )}
                                            </Box>
                                          </Flex>
                                        ) : (
                                          <Link
                                            to={getCategoryUrl(lvl2Id)}
                                            onClick={() => closeDrawer?.()}
                                          >
                                            <Text
                                              fontSize="xs"
                                              textTransform="uppercase"
                                              letterSpacing="wide"
                                              color={
                                                isLevel2Active
                                                  ? "black"
                                                  : "gray.600"
                                              }
                                              fontWeight={
                                                isLevel2Active
                                                  ? "bold"
                                                  : "normal"
                                              }
                                              mb={
                                                level2.categories?.length > 0
                                                  ? 2
                                                  : 0
                                              }
                                              _hover={{ opacity: 0.7 }}
                                              cursor="pointer"
                                              display="block"
                                            >
                                              {level2.name}
                                            </Text>
                                          </Link>
                                        )}

                                        {hasChildren && (
                                          <Collapse in={expandedLevel2[lvl2Id]}>
                                            <VStack
                                              align="stretch"
                                              spacing={2}
                                              pl={5}
                                              mt={1}
                                              borderLeft="1px solid"
                                              borderColor="blackAlpha.200"
                                            >
                                              {level2.categories.map(
                                                (level3) => {
                                                  const lvl3Id =
                                                    level3.id ||
                                                    level3.name
                                                      .replace(/\s+/g, "_")
                                                      .toLowerCase();
                                                  const isLevel3Active =
                                                    categoryId &&
                                                    normalizeId(lvl3Id) ===
                                                      normalizeId(categoryId);

                                                  return (
                                                    <Link
                                                      key={lvl3Id}
                                                      to={getCategoryUrl(
                                                        lvl3Id,
                                                      )}
                                                      onClick={() =>
                                                        closeDrawer?.()
                                                      }
                                                    >
                                                      <Text
                                                        fontSize="xs"
                                                        textTransform="uppercase"
                                                        letterSpacing="wide"
                                                        color={
                                                          isLevel3Active
                                                            ? "black"
                                                            : "gray.500"
                                                        }
                                                        fontWeight={
                                                          isLevel3Active
                                                            ? "bold"
                                                            : "normal"
                                                        }
                                                        textDecoration={
                                                          isLevel3Active
                                                            ? "underline"
                                                            : "none"
                                                        }
                                                        _hover={{
                                                          color: "black",
                                                        }}
                                                        cursor="pointer"
                                                        display="block"
                                                      >
                                                        {level3.name}
                                                      </Text>
                                                    </Link>
                                                  );
                                                },
                                              )}
                                            </VStack>
                                          </Collapse>
                                        )}
                                      </Box>
                                    );
                                  })}
                                </VStack>
                              )}
                            </Box>
                          );
                        })}
                      </VStack>
                    </Box>
                  </Collapse>
                </Box>
              )}
              <Divider borderColor={"blackAlpha.300"} />
              {/* Colors */}
              {filterList?.colors?.length > 0 && (
                <Box>
                  <Button
                    w="full"
                    justifyContent="space-between"
                    variant="ghost"
                    onClick={() => toggleAccordion("colors")}
                    _hover={{ bg: "transparent" }}
                  >
                    <Text fontSize="sm">COLOR</Text>
                    <Box
                      transform={
                        activeAccordion === "colors"
                          ? "rotate(0deg)"
                          : "rotate(270deg)"
                      }
                      transition="transform 0.3s"
                    >
                      <Box
                        as="svg"
                        w="12px"
                        h="8px"
                        viewBox="0 0 12 8"
                        fill="none"
                      >
                        <path
                          d="M1 1L6 6L11 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Box>
                    </Box>
                  </Button>
                  <Collapse in={activeAccordion === "colors"}>
                    <Box p={4}>
                      <VStack align="stretch" spacing={2}>
                        {filterList.colors
                          .filter((x) => Number(x.count || 0) > 0)
                          .map((item) => (
                            <Checkbox
                              key={item.id}
                              isChecked={localColors.includes(item.id)}
                              onChange={() =>
                                handleCheckboxChangeColor(item.id)
                              }
                              iconColor="white"
                              colorScheme="blackAlpha"
                              sx={blackSquareCheckboxSx}
                            >
                              <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="wide"
                              >
                                {item.name}
                              </Text>
                            </Checkbox>
                          ))}
                      </VStack>
                    </Box>
                  </Collapse>
                </Box>
              )}
              <Divider borderColor={"blackAlpha.300"} />
              {/* Sizes */}
              {filterList?.sizes?.length > 0 && (
                <Box>
                  <Button
                    w="full"
                    justifyContent="space-between"
                    variant="ghost"
                    onClick={() => toggleAccordion("sizes")}
                    _hover={{ bg: "transparent" }}
                  >
                    <Text fontSize="sm">SIZE</Text>
                    <Box
                      transform={
                        activeAccordion === "sizes"
                          ? "rotate(0deg)"
                          : "rotate(270deg)"
                      }
                      transition="transform 0.3s"
                    >
                      <Box
                        as="svg"
                        w="12px"
                        h="8px"
                        viewBox="0 0 12 8"
                        fill="none"
                      >
                        <path
                          d="M1 1L6 6L11 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Box>
                    </Box>
                  </Button>
                  <Collapse in={activeAccordion === "sizes"}>
                    <Box p={4}>
                      <Flex wrap="wrap" gap={2}>
                        {sortedSizes.map((item) => (
                          <SizeBox
                            key={item.id}
                            label={item.name}
                            checked={localSizes.includes(item.name)}
                            onToggle={() => handleCheckboxChangeSize(item.name)}
                          />
                        ))}
                      </Flex>
                    </Box>
                  </Collapse>
                </Box>
              )}

              <Divider borderColor={"blackAlpha.300"} />
              {/* Materials */}
              {filterList?.materials?.length > 0 && (
                <Box>
                  <Button
                    w="full"
                    justifyContent="space-between"
                    variant="ghost"
                    onClick={() => toggleAccordion("materials")}
                    _hover={{ bg: "transparent" }}
                  >
                    <Text fontSize="sm">MATERIAL</Text>
                    <Box
                      transform={
                        activeAccordion === "materials"
                          ? "rotate(0deg)"
                          : "rotate(270deg)"
                      }
                      transition="transform 0.3s"
                    >
                      <Box
                        as="svg"
                        w="12px"
                        h="8px"
                        viewBox="0 0 12 8"
                        fill="none"
                      >
                        <path
                          d="M1 1L6 6L11 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Box>
                    </Box>
                  </Button>
                  <Collapse in={activeAccordion === "materials"}>
                    <Box p={4}>
                      <VStack align="stretch" spacing={2}>
                        {filterList.materials
                          .filter((x) => Number(x.count || 0) > 0)
                          .map((item) => (
                            <Checkbox
                              key={item.id}
                              isChecked={localMaterials.includes(item.name)}
                              onChange={() =>
                                handleCheckboxChangeMaterial(item.name)
                              }
                              iconColor="white"
                              colorScheme="blackAlpha"
                              sx={blackSquareCheckboxSx}
                            >
                              <Text
                                fontSize="xs"
                                textTransform="uppercase"
                                letterSpacing="wide"
                              >
                                {item.name}
                              </Text>
                            </Checkbox>
                          ))}
                      </VStack>
                    </Box>
                  </Collapse>
                </Box>
              )}
              <Divider borderColor={"blackAlpha.300"} />
            </VStack>
            <Box px={2}>
              <VStack spacing={2} w="full">
                <Button
                  w="full"
                  h="35px"
                  borderRadius="0"
                  bg="black"
                  color="white"
                  fontSize="sm"
                  size="lg"
                  fontWeight="normal"
                  _hover={{ bg: "black" }}
                  onClick={handleApply}
                >
                  APPLY
                </Button>
                <Button
                  w="full"
                  h="35px"
                  borderRadius="0"
                  variant="outline"
                  borderColor="black"
                  bg="white"
                  color="black"
                  fontSize="sm"
                  size="lg"
                  fontWeight="normal"
                  onClick={handleClearAll}
                >
                  CLEAR ALL
                </Button>
              </VStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};

export default ChakraFilterSection;
