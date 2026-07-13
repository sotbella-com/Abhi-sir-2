import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Box,
  Text,
  Input,
  InputGroup,
  InputRightElement,
  InputLeftElement,
  Button,
  Flex,
  Container,
  HStack,
  useOutsideClick,
} from "@chakra-ui/react";
import { useMobile } from "@/components/molecules";
import SearchSuggestions from "@/components/common/SearchSuggestions";
import { getSearchSuggestions } from "@/api/services/sfccSearchService";
import { getContentData } from "@/api/services/homeapi";

const SearchBox = ({ setSearch, search, handleSearch, onSuggestionsChange }) => {
  const isMobile = useMobile();
  const [expanded, setExpanded] = useState(false);

  const [suggestions, setSuggestions] = useState(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const suggestionsRef = useRef(null);
  const inputRef = useRef(null);
  const suppressNextSuggestionsRef = useRef(false);

  const [searchSuggestionData, setSearchSuggestionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFirstSuggestionsRunRef = useRef(true);


  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getContentData('search-suggestion');
        if (response?.body) {
          setSearchSuggestionData(response.body['SEARCH SUGGESTION'] || []);
        }
      } catch (error) {
        // console.error("Failed to fetch contact data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // desktop categories
  // const desktopCategories = [
  //   "dresses",
  //   "party wear",
  //   "co-ord",
  //   "bodycon",
  //   "slit dress",
  //   "shorts",
  //   "office wears",
  //   "casuals",
  // ];

  // mobile categories 
  // const mobileCategories = [
  //   { label: "ALL", value: "" },
  //   { label: "PARTY WEAR", value: "party wear" },
  //   { label: "SORT SASSY", value: "sort sassy" },
  //   { label: "CO-ORDS", value: "co-ords" },
  //   { label: "DRESSES", value: "dresses" },
  //   { label: "DENIM", value: "denim" },
  //   { label: "CASUALS", value: "casuals" },
  //   { label: "BODYCON", value: "bodycon" },
  // ];
  const [activeMobileCat, setActiveMobileCat] = useState("ALL");

  // Capitalize only the first non-space character
  const capFirst = (s = "") => {
    const i = s.search(/\S/);
    if (i === -1) return s;
    return s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
  };

  useEffect(() => {
    setExpanded(Boolean(search && search.trim() !== ""));
  }, [search]);

  useEffect(() => {
    window.__suppressNextSuggestionsRef = suppressNextSuggestionsRef;
    return () => {
      if (window.__suppressNextSuggestionsRef === suppressNextSuggestionsRef) {
        delete window.__suppressNextSuggestionsRef;
      }
    };
  }, []);

  useEffect(() => {
    const run = async () => {
      const q = (search || "").trim();
      if (q.length >= 3) {
        setSuggestionsLoading(true);
        try {
          const data = await getSearchSuggestions(q);
          setSuggestions(data);

          const hasData = data && Object.keys(data).length > 0;

          // ✅ Don't auto-open on first run (refresh/hydration)
          const shouldShow =
            !isFirstSuggestionsRunRef.current &&
            !suppressNextSuggestionsRef.current &&
            hasData;

          setShowSuggestions(shouldShow);
          onSuggestionsChange?.(shouldShow ? data : null, shouldShow);
        } catch (err) {
          setSuggestions(null);
          setShowSuggestions(false);
          onSuggestionsChange?.(null, false);
        } finally {
          setSuggestionsLoading(false);
          suppressNextSuggestionsRef.current = false;
          isFirstSuggestionsRunRef.current = false;
        }
      } else {
        setSuggestions(null);
        setShowSuggestions(false);
        onSuggestionsChange?.(null, false);
        suppressNextSuggestionsRef.current = false;
      }
    };

    const id = setTimeout(run, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useOutsideClick({
    ref: suggestionsRef,
    handler: () => setShowSuggestions(false),
  });

  const submitSearch = (term) => {
    const q = typeof term === "string" ? term : search;   // ✅ use explicit if provided
    handleSearch(q);
    setExpanded(true);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion) => {
    suppressNextSuggestionsRef.current = true; // ✅ Prevent re-opening suggestions
    setSearch(suggestion);
    setShowSuggestions(false);

    // Direct call with the clicked value to ensure immediate search
    handleSearch(suggestion);
    setExpanded(true);
  };

  const clearInput = () => {
    setSearch("");
    setSuggestions(null);
    setShowSuggestions(false);
    setExpanded(false);
    inputRef.current?.focus();
  };

  // const showCategories = !expanded; // ❌ Removed to keep categories always visible
  const showCategories = true;

  return (
    <Fragment>
      <Box mt={isMobile ? "85px" : "8%"} />

      <Box pt={1}>
        <Container maxW="container.xl" p={0}>
          <Flex flexWrap="wrap" justify="center">
            <Box w="full" textAlign="center">
              <Text
                textTransform="uppercase"
                fontWeight="semibold"
                fontSize={{ base: "md", md: "lg" }}
                mb={{ base: 4, md: 6 }}
                color="#1d1d1d"
              >
                Find your perfect Style ?
              </Text>

              {showCategories && (
                <>
                  {isMobile ? (
                    /* ---------- MOBILE: pills ---------- */
                    <HStack
                      spacing={3}
                      justify="center"
                      flexWrap="wrap"
                      rowGap={3}
                    >
                      {searchSuggestionData.map((cat) => {
                        const isActive = activeMobileCat === cat.label;
                        return (
                          <Button
                            key={cat.label}
                            onClick={() => {
                              setActiveMobileCat(cat.label);
                              const val = cat.label;
                              suppressNextSuggestionsRef.current = true;
                              const v = val ? capFirst(val) : "";
                              suppressNextSuggestionsRef.current = true;
                              setSearch(v);
                              submitSearch(v); // ✅ pass explicit term (no stale state)

                            }}
                            borderRadius="0"
                            variant="outline"
                            borderColor="#1d1d1d"
                            bg={isActive ? "#1d1d1d" : "transparent"}
                            color={isActive ? "#ffffff" : "#1d1d1d"}
                            fontSize="9px"
                            fontWeight="medium"
                            textTransform="uppercase"
                            px={2}
                            py={1.5}
                            h="auto"
                            minH="auto"
                            _hover={{
                              bg: isActive ? "#1d1d1d" : "blackAlpha.50",
                            }}
                            _active={{ bg: "#1d1d1d", color: "#ffffff" }}
                            _focus={{ boxShadow: "none" }}
                          >
                            {cat.label}
                          </Button>
                        );
                      })}
                    </HStack>
                  ) : (
                    /* ---------- DESKTOP: your original style ---------- */
                    <HStack spacing={8} justify="center" flexWrap="wrap" gap={8}>
                      {searchSuggestionData.map((i) => {
                        const item = i?.label;
                        const isSelected = search?.toLowerCase() === item?.toLowerCase();
                        return (
                          <Button
                            key={item}
                            variant="ghost"
                            onClick={() => {
                              const v = capFirst(item);
                              suppressNextSuggestionsRef.current = true;
                              setSearch(v);
                              submitSearch(v);
                            }}
                            position="relative"
                            textTransform="uppercase"
                            fontSize="14px"
                            fontWeight="normal"
                            color="#1d1d1d"
                            _after={{
                              content: '""',
                              display: "block",
                              position: "absolute",
                              height: "1px",
                              width: "full",
                              bg: "black",
                              bottom: "-6px",
                              left: 0,
                              transform: isSelected ? "scaleX(1)" : "scaleX(0)",
                              transition: "transform 0.3s",
                            }}
                            _hover={{ _after: { transform: "scaleX(1)" } }}
                            _active={{ bg: "transparent" }}
                            _focus={{ bg: "transparent" }}
                            p={0}
                            h="auto"
                            minH="auto"
                          >
                            <Text>{item.replace(/-/g, " ")}</Text>
                          </Button>
                        )
                      })}
                    </HStack>
                  )}
                </>
              )}
            </Box>
          </Flex>
        </Container>
      </Box>

      {/* search input */}
      <Box pt={3}>
        <Box
          mt={{ md: 5 }}
          mx="auto"
          w={expanded ? "92%" : { base: "92%", md: "460px" }}
          position="relative"
          ref={suggestionsRef}
        >
          <InputGroup borderBottom="1px solid #ccc">
            <InputLeftElement width="2.25rem">
              <Button
                variant="ghost"
                onClick={submitSearch}
                p={0}
                h="auto"
                minH="auto"
                _hover={{ bg: "transparent" }}
                aria-label="Search"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.66667 13.9997C11.1645 13.9997 14 11.1641 14 7.66634C14 4.16854 11.1645 1.33301 7.66667 1.33301C4.16887 1.33301 1.33334 4.16854 1.33334 7.66634C1.33334 11.1641 4.16887 13.9997 7.66667 13.9997Z"
                    stroke="#1D1D1D"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.6667 14.6663L13.3333 13.333"
                    stroke="#1D1D1D"
                    strokeOpacity="0.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </InputLeftElement>

            <Input
              ref={inputRef}
              maxLength={50}
              type="text"
              inputMode="search"         // ✅ mobile keyboard shows search layout
              enterKeyHint="search"      // ✅ Enter key shows “Search”
              value={search}
              onChange={(e) => setSearch(capFirst(e.target.value))}
              onFocus={() => {
                if (suggestions && Object.keys(suggestions).length > 0) {
                  setShowSuggestions(true);
                }
              }}
              // onBlur removed - relying on useOutsideClick
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowSuggestions(false);
                  inputRef.current?.blur();
                  submitSearch(e.currentTarget.value); // ✅ explicit value
                }
              }}

              placeholder="Search..."
              color="black"
              textAlign={{ base: "left", md: "center" }}
              pl="2.25rem"
              pr="2.25rem"
              border="none"
              h="40px"
              _focus={{ outline: "none", boxShadow: "none" }}
              _focusVisible={{ outline: "none", boxShadow: "none" }}
              _placeholder={{ color: "blackAlpha.500" }}
            />

            {/* clear button */}
            <InputRightElement width="2.25rem">
              {search?.trim() && (
                <Button
                  onClick={clearInput}
                  variant="ghost"
                  p={0}
                  h="auto"
                  minH="auto"
                  _hover={{ bg: "transparent" }}
                  aria-label="Clear search"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M12.6668 3.33203L3.3335 12.6654M3.3335 3.33203L12.6668 12.6654"
                      stroke="#1D1D1D"
                      strokeOpacity="0.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Button>
              )}
            </InputRightElement>
          </InputGroup>

          {showSuggestions && (
            <Box
              position="absolute"
              top="100%"
              left={0}
              right={0}
              zIndex={1000}
              mt={1}
            >
              <SearchSuggestions
                suggestions={suggestions}
                loading={suggestionsLoading}
                onSuggestionClick={handleSuggestionClick}
                searchQuery={search}
              />
            </Box>
          )}
        </Box>
      </Box>
    </Fragment>
  );
};

export default SearchBox;
