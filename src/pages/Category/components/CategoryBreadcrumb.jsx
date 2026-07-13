import { Fragment } from "react";
import { Box, Text, Flex } from "@chakra-ui/react";
import { useMobile } from "@/components/molecules";

const CategoryBreadcrumb = ({ 
  categoryId, 
  categorySlug, 
  categoryInfo
}) => {
  const formatCategoryName = (id, info) => {
    if (info?.name) return info.name;
    if (!id) return "";
    return id
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const displayName = formatCategoryName(categoryId, categoryInfo);

  return (
    <Fragment>
      <Box 
        w="full" 
        textAlign="left" 
        mt={{ base: "60px", md: "90px" }} 
        px={{ base: "12px", md: "50px" }}
      >
        <Flex flexWrap="wrap">
          <Text fontSize="sm">
            <Text as="span" color="#6e6b6b">HOME</Text>
            <Text as="span" mx={2}>/</Text>
            <Text as="span" color="#6e6b6b">CATEGORIES</Text>
            <Text as="span" mx={2}>/</Text>
            <Text as="b">{displayName}</Text>
          </Text>
        </Flex>
        
      </Box>
    </Fragment>
  );
};

export default CategoryBreadcrumb;
