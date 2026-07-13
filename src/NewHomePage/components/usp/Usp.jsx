import { motion } from "motion/react";
import {
  Box,
  Grid,
  GridItem,
  Heading,
  Text,
  useToken,
  VStack, // ✅ CHANGED: added
} from "@chakra-ui/react";
import { UspShimmer } from "../../../components/layouts/Simmers/UspShimmer";

const cardData = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
        <path d="M2.49933 7.50009V13.5001C2.49933 17.2713 2.49933 19.1569 3.6709 20.3285C4.84247 21.5001 6.72809 21.5001 10.4993 21.5001H13.9993M21.4993 14.0001V7.50009" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M3.86842 5.3147L2.49933 7.50009H21.4993L20.2471 5.41312C19.3935 3.9903 18.9666 3.27889 18.2789 2.88949C17.5911 2.50009 16.7615 2.50009 15.1022 2.50009H8.95304C7.32931 2.50009 6.51744 2.50009 5.83946 2.87539C5.16148 3.25069 4.73046 3.9387 3.86842 5.3147Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M11.9993 7.50009V2.50009" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M15.9993 14.5001C15.9993 14.5001 13.4993 16.3413 13.4993 17.0001C13.4993 17.6589 15.9993 19.5001 15.9993 19.5001M13.9993 17.0001H19.2493C20.492 17.0001 21.4993 18.0075 21.4993 19.2501C21.4993 20.4927 20.492 21.5001 19.2493 21.5001H18.4993" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M9.99933 10.5001H13.9993" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
    header: "Easy Return & Exchange",
    para: "Enjoy easy returns within 7 days of delivery.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
        <path d="M21.5 12C21.5 17.2467 17.2467 21.5 12 21.5C10.3719 21.5 8.8394 21.0904 7.5 20.3687C5.63177 19.362 4.37462 20.2979 3.26592 20.4658C3.09774 20.4913 2.93024 20.4302 2.80997 20.31C2.62741 20.1274 2.59266 19.8451 2.6935 19.6074C3.12865 18.5818 3.5282 16.6382 2.98341 15C2.6698 14.057 2.5 13.0483 2.5 12C2.5 6.75329 6.75329 2.5 12 2.5C17.2467 2.5 21.5 6.75329 21.5 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M8.5 15.4984C8.5 13.5654 10.067 11.9984 12 11.9984C13.933 11.9984 15.5 13.5654 15.5 15.4984M14 10C14 11.1046 13.1046 12 12 12C10.8954 12 10 11.1046 10 10C10 8.89543 10.8954 8 12 8C13.1046 8 14 8.89543 14 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
    header: "24/7 Customer Support",
    para: "Support available anytime, anywhere.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
        <path d="M21 7V12M3 7C3 10.0645 3 16.7742 3 17.1613C3 18.5438 4.94564 19.3657 8.83693 21.0095C10.4002 21.6698 11.1818 22 12 22L12 11.3548" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M15 19C15 19 15.875 19 16.75 21C16.75 21 19.5294 16 22 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M8.32592 9.69138L5.40472 8.27785C3.80157 7.5021 3 7.11423 3 6.5C3 5.88577 3.80157 5.4979 5.40472 4.72215L8.32592 3.30862C10.1288 2.43621 11.0303 2 12 2C12.9697 2 13.8712 2.4362 15.6741 3.30862L18.5953 4.72215C20.1984 5.4979 21 5.88577 21 6.5C21 7.11423 20.1984 7.5021 18.5953 8.27785L15.6741 9.69138C13.8712 10.5638 12.9697 11 12 11C11.0303 11 10.1288 10.5638 8.32592 9.69138Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M6 12L8 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
        <path d="M17 4L7 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path>
      </svg>
    ),
    header: "Premium Quality",
    para: "Crafted for your comfort and satisfaction.",
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" color="#000000" fill="none">
        <circle cx="17" cy="18" r="2" stroke="#141B34" strokeWidth="1.5" />
        <circle cx="7" cy="18" r="2" stroke="#141B34" strokeWidth="1.5" />
        <path d="M5 17.9724C3.90328 17.9178 3.2191 17.7546 2.73223 17.2678C2.24536 16.7809 2.08222 16.0967 2.02755 15M9 18H15M19 17.9724C20.0967 17.9178 20.7809 17.7546 21.2678 17.2678C22 16.5355 22 15.357 22 13V11H17.3C16.5555 11 16.1832 11 15.882 10.9021C15.2731 10.7043 14.7957 10.2269 14.5979 9.61803C14.5 9.31677 14.5 8.94451 14.5 8.2C14.5 7.08323 14.5 6.52485 14.3532 6.07295C14.0564 5.15964 13.3404 4.44358 12.4271 4.14683C11.9752 4 11.4168 4 10.3 4H2" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 8H8" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M2 11H6" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14.5 6H16.3212C17.7766 6 18.5042 6 19.0964 6.35371C19.6886 6.70742 20.0336 7.34811 20.7236 8.6295L22 11" stroke="#141B34" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    header: "Secure & Fast Delivery",
    para: "Shop securely with fast and reliable doorstep delivery.",
  },
];

const MotionBox = motion.create(Box);

const Card = ({ data, index }) => {
  const { icon, para, header } = data;
  const [bg, border] = useToken("colors", ["#fafafa", "blackAlpha.300"]);

  return (
    <MotionBox
      // bg={bg}
      // border="1px solid"
      // borderColor={border}
      rounded="1vw"
      px={{ base: "1.2vw", md: "1.2vw" }}
      pt={{ base: "1vw", md: "1vw" }}
      h="100%"
      w="full"
      display="flex"
      flexDir="column"
      variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.5, delay: index * 0.2 }}
    >
      <Box
        as="div"
        display="flex"
        alignItems="center"
        gap={{ base: "8px", md: "10px" }}
        mb={{ base: "6px", md: "8px" }}
      >
        <Box
          color="black"
          lineHeight={0}
          sx={{
            "& svg": {
              width: { base: "18px", sm: "22px", md: "24px", lg: "26px" },
              height: { base: "18px", sm: "22px", md: "24px", lg: "26px" },
              display: "block",
            },
            "& svg *": { stroke: "currentColor" },
          }}
        >
          {icon}
        </Box>

        <Heading
          as="h2"
          fontWeight="semibold"
          // m={0}
          fontSize={{ base: "12px", lg: "14px", xl: "16px" }}
        >
          {header}
        </Heading>
      </Box>

      {/* <Text fontWeight="normal" fontSize={{ base: "10px", md: "xs" }}>
        {para}
      </Text> */}
      
    </MotionBox>
  );
};

const Usp = ({ loading = false }) => {
  if (loading) return <UspShimmer />;

  return (
    <MotionBox
      w="full"
      h="auto"
      py={{ base: "2vw", lg: "3vw", xl: "1.5vw" }}
      px={{ base: "2vw", lg: "4vw", xl: "4vw" }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      {/* ✅ CHANGED: Title + Grid wrapped to keep title centered */}
      <VStack spacing={{ base: 3, md: 4 }} w="100%" align="center">
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
            Your VIP Privileges
          </Text>

          {/* Right line */}
          <Box flex="1" h="1px" bg="blackAlpha.300" />
        </Box>

        <Grid
          templateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
          gap={{ base: "10px", lg: 6, xl: 6 }}
          alignItems="stretch"
          autoRows="1fr"
          w="100%"
        >
          {cardData.map((val, i) => (
            <GridItem key={i} display="flex">
              <Card data={val} index={i} />
            </GridItem>
          ))}
        </Grid>
      </VStack>
    </MotionBox>
  );
};

export default Usp;
