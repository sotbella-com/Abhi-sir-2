import React from 'react';
import {
  Box,
  VStack,
  Text,
  HStack,
  Input,
  Checkbox,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  Divider
} from '@chakra-ui/react';

const DesktopFilterSidebar = ({
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
  range,
  setRange,
  handlePriceChange,
  handleCheckboxChange,
  clearAll
}) => {
  return (
    <Box
      position="sticky"
      top="140px"
      w="250px"
      h="fit-content"
      bg="white"
      borderRight="1px"
      borderColor="gray.200"
      p={4}
      mr={4}
    >
      <VStack align="stretch" spacing={6}>
        <Text fontSize="lg" fontWeight="semibold" mb={2}>
          Filters
        </Text>

        {/* Price Range */}
        <Box>
          <Text fontWeight="semibold" mb={3}>Price Range</Text>
          <VStack spacing={4}>
            <Slider
              value={range}
              onChange={handlePriceChange}
              min={filterData?.price?.min || 0}
              max={filterData?.price?.max || 10000}
              step={1}
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

        <Button variant="outline" onClick={clearAll} size="sm">
          Reset All Filters
        </Button>
      </VStack>
    </Box>
  );
};

export default DesktopFilterSidebar;
