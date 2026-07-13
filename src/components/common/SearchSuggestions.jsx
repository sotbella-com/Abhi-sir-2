import React from 'react';
import {
  Box,
  VStack,
  Text,
  Divider,
  Badge,
  Flex,
  Spinner,
  Center
} from '@chakra-ui/react';

const SearchSuggestions = ({
  suggestions,
  loading,
  onSuggestionClick,
  searchQuery = ""
}) => {
  if (loading) {
    return (
      <Box p={4} bg="white" boxShadow="md" borderRadius="md">
        <Center>
          <Spinner size="sm" />
          <Text ml={2} fontSize="sm" color="gray.500">
            Loading suggestions...
          </Text>
        </Center>
      </Box>
    );
  }

  if (!suggestions || Object.keys(suggestions).length === 0) {
    return null;
  }

  const {
    brandSuggestions = {},
    categorySuggestions = {},
    contentSuggestions = {},
    customSuggestions = {},
    productSuggestions = {}
  } = suggestions;

  // Extract all suggestion types
  const categories = categorySuggestions.categories || [];
  const allProducts = productSuggestions.products || [];
  
  // ✅ Deduplicate products by productName (to show only unique products, not size variants)
  // Different size variants (ST-1430L, ST-1430S, etc.) have the same productName
  // We want to show the product only once, not all its variants
  const products = React.useMemo(() => {
    const seen = new Set();
    return allProducts.filter((product) => {
      // Use productName as primary key to group variants together
      // If productName is missing, fallback to productId
      const key = product.productName || product.productId || '';
      if (!key) return true; // Keep products without name/ID (shouldn't happen, but safe)
      
      // Normalize key to handle case-insensitive matching
      const normalizedKey = key.toLowerCase().trim();
      
      if (seen.has(normalizedKey)) {
        return false; // Duplicate product name found (same product, different size), filter it out
      }
      
      seen.add(normalizedKey);
      return true; // First occurrence of this product name, keep it
    });
  }, [allProducts]);
  
  // ✅ Deduplicate suggested phrases
  const allSuggestedPhrases = [
    ...(categorySuggestions.suggestedPhrases || []),
    ...(productSuggestions.suggestedPhrases || [])
  ];
  const suggestedPhrases = React.useMemo(() => {
    const seen = new Set();
    return allSuggestedPhrases.filter((phrase) => {
      const phraseText = (phrase.phrase || '').toLowerCase().trim();
      if (!phraseText) return true;
      
      if (seen.has(phraseText)) {
        return false;
      }
      seen.add(phraseText);
      return true;
    });
  }, [allSuggestedPhrases]);
  
  // ✅ Deduplicate suggested terms
  const allSuggestedTerms = [
    ...(brandSuggestions.suggestedTerms || []),
    ...(contentSuggestions.suggestedTerms || []),
    ...(customSuggestions.suggestedTerms || [])
  ];
  const suggestedTerms = React.useMemo(() => {
    const seen = new Set();
    return allSuggestedTerms.filter((term) => {
      const termText = ((term.value || term.originalTerm || '')).toLowerCase().trim();
      if (!termText) return true;
      
      if (seen.has(termText)) {
        return false;
      }
      seen.add(termText);
      return true;
    });
  }, [allSuggestedTerms]);  
  

  // If no suggestions, don't render anything
  if (categories.length === 0 && products.length === 0 && suggestedPhrases.length === 0 && suggestedTerms.length === 0) {
    return null;
  }

  const highlightMatch = (text, query) => {
    if (!query || !text || typeof text !== 'string') return text || '';
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <Text as="span">
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <Text as="span" fontWeight="bold" key={index}>
              {part}
            </Text>
          ) : (
            part
          )
        )}
      </Text>
    );
  };

  return (
    <Box bg="white" borderRadius="md" p={4} maxH="400px" overflowY="auto">
      <VStack align="stretch" spacing={3}>
        {/* Category Suggestions */}
        {/* {categories.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Categories</Text>
            {categories.map((cat) => (
              <Box
                key={cat.id || Math.random()}
                p={2}
                _hover={{ bg: "gray.50" }}
                cursor="pointer"
                onClick={() => onSuggestionClick(cat.name || '', 'category')}
                borderRadius="md"
              >
                <Flex align="center">
                  {highlightMatch(cat.name || '', searchQuery)}
                  {cat.parentCategoryName && (
                    <Badge ml={2} colorScheme="gray" variant="outline">
                      {cat.parentCategoryName}
                    </Badge>
                  )}
                </Flex>
              </Box>
            ))}
            <Divider my={2} />
          </Box>
        )} */}

        {/* Product Suggestions */}
        {products.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Products</Text>
            {products.map((product) => (
              <Box
                key={product.productId || Math.random()}
                p={2}
                _hover={{ bg: "gray.50" }}
                cursor="pointer"
                onClick={() => onSuggestionClick(product.productName || '', 'product')}
                borderRadius="md"
                fontSize={{ base: "10px", md: "xs", lg: "sm" }}
              >
                <Flex align="center" justify="space-between">
                  <Flex align="center">
                    {highlightMatch(product.productName || '', searchQuery)}
                  </Flex>
                  {Number(product.price) > 0 && (
                    <Text color="blackAlpha.600" whiteSpace={"nowrap"}>
                      {product.currency} {Number(product.price).toFixed(2)}
                    </Text>
                  )}
                </Flex>
              </Box>
            ))}
            <Divider my={2} />
          </Box>
        )}

        {/* Suggested Phrases */}
        {/* {suggestedPhrases.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Suggested Phrases</Text>
            {suggestedPhrases.map((phrase, index) => (
              <Box
                key={`phrase-${index}`}
                p={2}
                _hover={{ bg: "gray.50" }}
                cursor="pointer"
                onClick={() => onSuggestionClick(phrase.phrase || '', 'phrase')}
                borderRadius="md"
              >
                <Flex align="center">
                  {highlightMatch(phrase.phrase || '', searchQuery)}
                  {phrase.exactMatch && <Badge ml={2} colorScheme="green">Exact Match</Badge>}
                </Flex>
              </Box>
            ))}
            <Divider my={2} />
          </Box>
        )} */}

        {/* Related Terms */}
        {/* {suggestedTerms.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Related Terms</Text>
            {suggestedTerms.map((term, index) => (
              <Box
                key={`term-${index}`}
                p={2}
                _hover={{ bg: "gray.50" }}
                cursor="pointer"
                onClick={() => onSuggestionClick(term.value || term.originalTerm || '', 'term')}
                borderRadius="md"
              >
                {highlightMatch(term.value || term.originalTerm || '', searchQuery)}
                {term.corrected && <Badge ml={2} colorScheme="orange">Corrected</Badge>}
              </Box>
            ))}
          </Box>
        )} */}
      </VStack>
    </Box>
  );
};

export default SearchSuggestions;