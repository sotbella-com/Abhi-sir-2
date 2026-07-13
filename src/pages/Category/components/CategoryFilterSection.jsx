import { Fragment, useState, useEffect, useRef } from "react";
import { 
  Box, 
  Flex, 
  Text, 
  Button, 
  VStack, 
  HStack, 
  Input, 
  Checkbox, 
  Slider, 
  SliderTrack, 
  SliderFilledTrack, 
  SliderThumb,
  useDisclosure,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  IconButton,
  Badge,
  Divider,
  Collapse,
  useBreakpointValue,
  Select,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuOptionGroup,
  MenuDivider,
  Spacer
} from "@chakra-ui/react";
import { useMobile } from "@/components/molecules";
import { IoMdClose } from "react-icons/io";
import { FiFilter, FiChevronDown } from "react-icons/fi";

const CategoryFilterSection = ({
  filterData,
  selectedCategories,
  setSelectedCategories,
  selectedColors,
  setSelectedColors,
  selectedMaterials,
  setSelectedMaterials,
  selectedSizes,
  setSelectedSizes,
  priceRange,
  setPriceRange,
  selectedSort,
  setSelectedSort,
  sortingOptions,
  activeView,
  setActiveView,
  totalProducts
}) => {
  const isMobile = useMobile();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [showToolbar, setShowToolbar] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const IDLE_DELAY = 500;

  // Price slider state
  const [range, setRange] = useState([priceRange.min, priceRange.max]);
  const [priceStep, setPriceStep] = useState(1);

  // Toolbar scroll behavior
  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 100);
      if (showToolbar) setShowToolbar(false);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setShowToolbar(true), IDLE_DELAY);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, [showToolbar]);

  // Price slider setup
  useEffect(() => {
    if (filterData?.price?.min !== undefined && filterData?.price?.max !== undefined) {
      const newStep = Math.round((filterData.price.max - filterData.price.min) / 100);
      setPriceStep(newStep > 0 ? newStep : 1);
      setRange([filterData.price.min, filterData.price.max]);
    }
  }, [filterData?.price?.min, filterData?.price?.max]);

  const handlePriceChange = (value) => {
    setRange(value);
    setPriceRange({ min: value[0], max: value[1] });
  };

  // Checkbox handlers
  const handleCheckboxChange = (type, name) => {
    const setters = {
      categories: setSelectedCategories,
      colors: setSelectedColors,
      materials: setSelectedMaterials,
      sizes: setSelectedSizes
    };
    
    const getters = {
      categories: selectedCategories,
      colors: selectedColors,
      materials: selectedMaterials,
      sizes: selectedSizes
    };

    const setter = setters[type];
    const getter = getters[type];
    
    if (setter && getter) {
      setter((prev) =>
        prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
      );
    }
  };

  // Applied filters
  const appliedFilters = (() => {
    const chips = [];
    
    if (
      filterData?.price &&
      (range?.[0] !== filterData.price.min || range?.[1] !== filterData.price.max)
    ) {
      chips.push({ 
        type: "price", 
        label: `₹${range[0]} – ₹${range[1]}` 
      });
    }
    
    selectedCategories?.forEach((name) =>
      chips.push({ type: "category", value: name, label: name })
    );
    selectedColors?.forEach((name) =>
      chips.push({ type: "color", value: name, label: name })
    );
    selectedMaterials?.forEach((name) =>
      chips.push({ type: "material", value: name, label: name })
    );
    selectedSizes?.forEach((name) => 
      chips.push({ type: "size", value: name, label: name })
    );
    
    return chips;
  })();

  const removeChip = (chip) => {
    switch (chip.type) {
      case "price": {
        const min = filterData?.price?.min ?? 0;
        const max = filterData?.price?.max ?? 0;
        setRange([min, max]);
        setPriceRange({ min, max });
        break;
      }
      case "category":
        setSelectedCategories((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "color":
        setSelectedColors((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "material":
        setSelectedMaterials((prev) => prev.filter((v) => v !== chip.value));
        break;
      case "size":
        setSelectedSizes((prev) => prev.filter((v) => v !== chip.value));
        break;
      default:
        break;
    }
  };

  const clearAll = () => {
    const min = filterData?.price?.min ?? 0;
    const max = filterData?.price?.max ?? 0;
    setRange([min, max]);
    setPriceRange({ min, max });
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedMaterials([]);
    setSelectedSizes([]);
  };

  // View mode icons
  const ViewModeButton = ({ mode, icon, title }) => (
    <IconButton
      aria-label={title}
      icon={icon}
      variant="ghost"
      size="sm"
      colorScheme={activeView === mode ? "black" : "gray"}
      color={activeView === mode ? "white" : "gray.500"}
      bg={activeView === mode ? "black" : "transparent"}
      _hover={{
        bg: activeView === mode ? "black" : "gray.100",
        color: activeView === mode ? "white" : "black"
      }}
      onClick={() => setActiveView(mode)}
    />
  );

  return (
    <Fragment>
      {/* Sticky Toolbar */}
      <Box
        position={isScrolled ? "fixed" : "sticky"}
        top={{ base: "50px", md: "90px" }}
        zIndex={20}
        w="full"
        py={{ base: 1, md: 2 }}
        bg="white"
        borderBottom="1px"
        borderColor="gray.200"
        transition="all 0.3s"
        opacity={showToolbar ? 1 : 0}
        transform={showToolbar ? "translateY(0)" : "translateY(-100%)"}
        pointerEvents={showToolbar ? "auto" : "none"}
      >
        <Box px={{ base: "12px", md: "50px" }}>
          <Flex justify="space-between" align="center" w="full">
            <HStack spacing={3}>
              <Button
                leftIcon={<FiFilter />}
                variant="ghost"
                size="sm"
                onClick={onOpen}
                display={{ base: "flex", md: "none" }}
              >
                Filter
              </Button>
              
              <Text fontSize="sm" color="gray.600">
                {totalProducts} products
              </Text>
            </HStack>

            <HStack spacing={3}>
              {/* Sort Dropdown */}
              <Menu>
                <MenuButton as={Button} rightIcon={<FiChevronDown />} size="sm" variant="ghost">
                  {selectedSort || "Sort By"}
                </MenuButton>
                <MenuList>
                  {sortingOptions.map((option) => (
                    <MenuItem
                      key={option.id}
                      onClick={() => setSelectedSort(option.id)}
                    >
                      {option.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>

              {/* View Mode Buttons */}
              <HStack spacing={1}>
                <ViewModeButton
                  mode="simple"
                  icon={
                    <Box>
                      <Box w="2" h="3" border="1px" borderColor="currentColor" />
                      <Box w="2" h="3" border="1px" borderColor="currentColor" ml="1" />
                    </Box>
                  }
                  title="Simple view"
                />
                <ViewModeButton
                  mode="grid"
                  icon={
                    <Box>
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" />
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" ml="1" />
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" mt="1" />
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" ml="1" mt="1" />
                    </Box>
                  }
                  title="Grid view"
                />
                <ViewModeButton
                  mode="zigzag"
                  icon={
                    <Box>
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" />
                      <Box w="3" h="1.5" border="1px" borderColor="currentColor" ml="1" />
                      <Box w="1.5" h="1.5" border="1px" borderColor="currentColor" mt="1" />
                    </Box>
                  }
                  title="ZigZag view"
                />
              </HStack>
            </HStack>
          </Flex>
        </Box>
      </Box>


      {/* Applied Filters Strip */}
      {appliedFilters.length > 0 && (
        <Box
          w="full"
          zIndex={19}
          bg="white"
          borderY="1px"
          borderColor="gray.200"
          mb={2}
        >
          <Box px={{ base: "12px", md: "50px" }}>
            <Flex flexWrap="wrap" align="center" gap={2} py={2}>
              {appliedFilters.map((chip, idx) => (
                <Badge
                  key={`${chip.type}-${chip.value ?? "price"}-${idx}`}
                  colorScheme="gray"
                  variant="subtle"
                  px={3}
                  py={1}
                  borderRadius="full"
                  cursor="pointer"
                  _hover={{ bg: "black", color: "white" }}
                  onClick={() => removeChip(chip)}
                >
                  {chip.label}
                  <Text as="span" ml={1} fontSize="xs">×</Text>
                </Badge>
              ))}
              
              <Spacer />
              <Button
                size="xs"
                variant="link"
                color="gray.500"
                onClick={clearAll}
              >
                Clear all
              </Button>
            </Flex>
          </Box>
        </Box>
      )}

      {/* Mobile Filter Drawer */}
      <Drawer isOpen={isOpen} onClose={onClose} placement="left" size="sm">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Filter Products</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={6}>
              {/* Price Range */}
              <Box>
                <Text fontWeight="semibold" mb={3}>Price Range</Text>
                <VStack spacing={4}>
                  <Slider
                    value={range}
                    onChange={handlePriceChange}
                    min={filterData?.price?.min || 0}
                    max={filterData?.price?.max || 10000}
                    step={priceStep}
                  >
                    <SliderTrack>
                      <SliderFilledTrack />
                    </SliderTrack>
                    <SliderThumb boxSize={4} />
                    <SliderThumb boxSize={4} />
                  </Slider>
                  <HStack spacing={4}>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Min Price</Text>
                      <Input
                        size="sm"
                        value={range[0]}
                        readOnly
                        variant="filled"
                      />
                    </Box>
                    <Box>
                      <Text fontSize="xs" color="gray.500">Max Price</Text>
                      <Input
                        size="sm"
                        value={range[1]}
                        readOnly
                        variant="filled"
                      />
                    </Box>
                  </HStack>
                </VStack>
              </Box>

              {/* Categories */}
              {filterData?.categories?.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>Categories</Text>
                  <VStack align="stretch" spacing={2}>
                    {filterData.categories.map((item) => (
                      <Checkbox
                        key={item.id}
                        isChecked={selectedCategories.includes(item.id)}
                        onChange={() => handleCheckboxChange("categories", item.id)}
                      >
                        {item.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Colors */}
              {filterData?.colors?.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>Colors</Text>
                  <VStack align="stretch" spacing={2}>
                    {filterData.colors.map((item) => (
                      <Checkbox
                        key={item.id}
                        isChecked={selectedColors.includes(item.id)}
                        onChange={() => handleCheckboxChange("colors", item.id)}
                      >
                        {item.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Materials */}
              {filterData?.materials?.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>Materials</Text>
                  <VStack align="stretch" spacing={2}>
                    {filterData.materials.map((item) => (
                      <Checkbox
                        key={item.id}
                        isChecked={selectedMaterials.includes(item.id)}
                        onChange={() => handleCheckboxChange("materials", item.id)}
                      >
                        {item.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              )}

              {/* Sizes */}
              {filterData?.sizes?.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" mb={3}>Sizes</Text>
                  <VStack align="stretch" spacing={2}>
                    {filterData.sizes.map((item) => (
                      <Checkbox
                        key={item.id}
                        isChecked={selectedSizes.includes(item.id)}
                        onChange={() => handleCheckboxChange("sizes", item.id)}
                      >
                        {item.name}
                      </Checkbox>
                    ))}
                  </VStack>
                </Box>
              )}

              <Divider />

              <HStack spacing={3}>
                <Button variant="outline" onClick={clearAll} flex={1}>
                  Reset All
                </Button>
                <Button colorScheme="black" onClick={onClose} flex={1}>
                  Apply Filters
                </Button>
              </HStack>
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Fragment>
  );
};

export default CategoryFilterSection;