import { Fragment, useState, useEffect } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { Link as RouterLink } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
// import contactServices from "@/api/services/contact";
import { getContentData } from "@/api/services/homeapi";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import {
  Box,
  Flex,
  Heading,
  Text,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { ContactCardShimmer } from "../Simmers/ContactUsShimmer";

const MobileContactRowCard = ({ item, icon, getHref }) => {
  const href = getHref(item.Title, item.Contact);

  return (
    <Box
      w="full"
      border="1px solid"
      borderColor="blackAlpha.500"
      px={4}
      py={3}
    >
      <Flex align="start" justify="space-between" gap={4}>
        {/* LEFT: icon + title */}
        <Flex direction="column" align="flex-start" gap={2} flexShrink={0} w="40%">
          <Box
            w="50px"
            h="50px"
            border="1px solid"
            borderColor="blackAlpha.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {icon}
          </Box>

          <Text
            fontSize="sm"
            fontWeight="semibold"
            textTransform="capitalize"
            color="#1d1d1d"
          >
            {item.Title}
          </Text>
        </Flex>

        {/* RIGHT: contact + timing/desc */}
        <Flex direction="column" align="flex-start" textAlign="left" flex="1">
          <ChakraLink
            href={href}
            fontSize="sm"
            fontWeight="semibold"
            color="#1d1d1d"
            borderBottom="1px solid"
            borderColor="#1d1d1d"
            pb={0.5}
            _hover={{ textDecoration: "none" }}
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
            onClick={(e) => {
              if (!href || href === "#") e.preventDefault();
            }}
          >
            {item.Contact}
          </ChakraLink>

          <Text fontSize="xs" color="blackAlpha.600" mt={2}>
            {item.Description}
          </Text>
        </Flex>
      </Flex>
    </Box>
  );
};

const normalizePhoneForTel = (val = "") => {
  return String(val).trim().replace(/[^\d+]/g, "");
};

const getContactHref = (title, contact) => {
  const t = (title || "").toLowerCase();
  const c = String(contact || "").trim();

  if (!c) return "#";
  if (t.includes("call")) return `tel:${normalizePhoneForTel(c)}`;
  if (c.includes("@")) return `mailto:${c}`;
  return c;
};

const ContactUs = () => {
  const isMobile = useMobile();

  const socialIconMap = {
    instagram: (
      <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clipPath="url(#clip0_289_16994)">
          <path d="M12 2.66094C15.2063 2.66094 15.5859 2.675 16.8469 2.73125C18.0188 2.78281 18.6516 2.97969 19.0734 3.14375C19.6313 3.35938 20.0344 3.62188 20.4516 4.03906C20.8734 4.46094 21.1313 4.85938 21.3469 5.41719C21.5109 5.83906 21.7078 6.47656 21.7594 7.64375C21.8156 8.90937 21.8297 9.28906 21.8297 12.4906C21.8297 15.6969 21.8156 16.0766 21.7594 17.3375C21.7078 18.5094 21.5109 19.1422 21.3469 19.5641C21.1313 20.1219 20.8688 20.525 20.4516 20.9422C20.0297 21.3641 19.6313 21.6219 19.0734 21.8375C18.6516 22.0016 18.0141 22.1984 16.8469 22.25C15.5813 22.3063 15.2016 22.3203 12 22.3203C8.79375 22.3203 8.41406 22.3063 7.15313 22.25C5.98125 22.1984 5.34844 22.0016 4.92656 21.8375C4.36875 21.6219 3.96563 21.3594 3.54844 20.9422C3.12656 20.5203 2.86875 20.1219 2.65313 19.5641C2.48906 19.1422 2.29219 18.5047 2.24063 17.3375C2.18438 16.0719 2.17031 15.6922 2.17031 12.4906C2.17031 9.28438 2.18438 8.90469 2.24063 7.64375C2.29219 6.47187 2.48906 5.83906 2.65313 5.41719C2.86875 4.85938 3.13125 4.45625 3.54844 4.03906C3.97031 3.61719 4.36875 3.35938 4.92656 3.14375C5.34844 2.97969 5.98594 2.78281 7.15313 2.73125C8.41406 2.675 8.79375 2.66094 12 2.66094ZM12 0.5C8.74219 0.5 8.33438 0.514062 7.05469 0.570312C5.77969 0.626563 4.90313 0.832812 4.14375 1.12812C3.35156 1.4375 2.68125 1.84531 2.01563 2.51562C1.34531 3.18125 0.9375 3.85156 0.628125 4.63906C0.332812 5.40313 0.126563 6.275 0.0703125 7.55C0.0140625 8.83437 0 9.24219 0 12.5C0 15.7578 0.0140625 16.1656 0.0703125 17.4453C0.126563 18.7203 0.332812 19.5969 0.628125 20.3563C0.9375 21.1484 1.34531 21.8188 2.01563 22.4844C2.68125 23.15 3.35156 23.5625 4.13906 23.8672C4.90313 24.1625 5.775 24.3687 7.05 24.425C8.32969 24.4812 8.7375 24.4953 11.9953 24.4953C15.2531 24.4953 15.6609 24.4812 16.9406 24.425C18.2156 24.3687 19.0922 24.1625 19.8516 23.8672C20.6391 23.5625 21.3094 23.15 21.975 22.4844C22.6406 21.8188 23.0531 21.1484 23.3578 20.3609C23.6531 19.5969 23.8594 18.725 23.9156 17.45C23.9719 16.1703 23.9859 15.7625 23.9859 12.5047C23.9859 9.24688 23.9719 8.83906 23.9156 7.55938C23.8594 6.28438 23.6531 5.40781 23.3578 4.64844C23.0625 3.85156 22.6547 3.18125 21.9844 2.51562C21.3188 1.85 20.6484 1.4375 19.8609 1.13281C19.0969 0.8375 18.225 0.63125 16.95 0.575C15.6656 0.514063 15.2578 0.5 12 0.5Z" fill="#1D1D1D" />
          <path d="M12 6.33594C8.59688 6.33594 5.83594 9.09688 5.83594 12.5C5.83594 15.9031 8.59688 18.6641 12 18.6641C15.4031 18.6641 18.1641 15.9031 18.1641 12.5C18.1641 9.09688 15.4031 6.33594 12 6.33594ZM12 16.4984C9.79219 16.4984 8.00156 14.7078 8.00156 12.5C8.00156 10.2922 9.79219 8.50156 12 8.50156C14.2078 8.50156 15.9984 10.2922 15.9984 12.5C15.9984 14.7078 14.2078 16.4984 12 16.4984Z" fill="#1D1D1D" />
          <path d="M19.8469 6.09238C19.8469 6.88926 19.2 7.53145 18.4078 7.53145C17.6109 7.53145 16.9688 6.88457 16.9688 6.09238C16.9688 5.29551 17.6156 4.65332 18.4078 4.65332C19.2 4.65332 19.8469 5.3002 19.8469 6.09238Z" fill="#1D1D1D" />
        </g>
        <defs>
          <clipPath id="clip0_289_16994">
            <rect width="24" height="24" fill="white" transform="translate(0 0.5)" />
          </clipPath>
        </defs>
      </svg>
    ),
    facebook: (
      <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0.5C5.37264 0.5 0 5.87264 0 12.5C0 18.1275 3.87456 22.8498 9.10128 24.1467V16.1672H6.62688V12.5H9.10128V10.9198C9.10128 6.83552 10.9498 4.9424 14.9597 4.9424C15.72 4.9424 17.0318 5.09168 17.5685 5.24048V8.56448C17.2853 8.53472 16.7933 8.51984 16.1822 8.51984C14.2147 8.51984 13.4544 9.26528 13.4544 11.203V12.5H17.3741L16.7006 16.1672H13.4544V24.4122C19.3963 23.6946 24.0005 18.6354 24.0005 12.5C24 5.87264 18.6274 0.5 12 0.5Z" fill="#1D1D1D" />
      </svg>
    ),
    twitter: (
      <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.3263 0.404297H20.6998L13.3297 8.82779L22 20.2903H15.2112L9.89404 13.3383L3.80995 20.2903H0.434432L8.31743 11.2804L0 0.404297H6.96111L11.7674 6.75863L17.3263 0.404297ZM16.1423 18.2711H18.0116L5.94539 2.31743H3.93946L16.1423 18.2711Z" fill="#1D1D1D" />
      </svg>
    ),
  };

  const contactIconMap = {
    "Call us": (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M38.2796 31.6053C38.2796 32.2653 38.133 32.9437 37.8213 33.6037C37.5096 34.2637 37.1063 34.887 36.5746 35.4737C35.6763 36.4637 34.6863 37.1787 33.568 37.637C32.468 38.0953 31.2763 38.3337 29.993 38.3337C28.123 38.3337 26.1246 37.8937 24.0163 36.9953C21.908 36.097 19.7996 34.887 17.7096 33.3653C15.6013 31.8253 13.603 30.1203 11.6963 28.232C9.80797 26.3253 8.10297 24.327 6.5813 22.237C5.07797 20.147 3.86797 18.057 2.98797 15.9853C2.10797 13.8953 1.66797 11.897 1.66797 9.99033C1.66797 8.74366 1.88797 7.55199 2.32797 6.45199C2.76797 5.33366 3.46464 4.30699 4.4363 3.39033C5.60964 2.23533 6.89297 1.66699 8.24964 1.66699C8.76297 1.66699 9.2763 1.77699 9.73464 1.99699C10.2113 2.21699 10.633 2.54699 10.963 3.02366L15.2163 9.01866C15.5463 9.47699 15.7846 9.89866 15.9496 10.302C16.1146 10.687 16.2063 11.072 16.2063 11.4203C16.2063 11.8603 16.078 12.3003 15.8213 12.722C15.583 13.1437 15.2346 13.5837 14.7946 14.0237L13.4013 15.472C13.1996 15.6737 13.108 15.912 13.108 16.2053C13.108 16.352 13.1263 16.4803 13.163 16.627C13.218 16.7737 13.273 16.8837 13.3096 16.9937C13.6396 17.5987 14.208 18.387 15.0146 19.3403C15.8396 20.2937 16.7196 21.2653 17.673 22.237C18.663 23.2087 19.6163 24.107 20.588 24.932C21.5413 25.7387 22.3296 26.2887 22.953 26.6187C23.0446 26.6553 23.1546 26.7103 23.283 26.7653C23.4296 26.8203 23.5763 26.8387 23.7413 26.8387C24.053 26.8387 24.2913 26.7287 24.493 26.527L25.8863 25.152C26.3446 24.6937 26.7846 24.3453 27.2063 24.1253C27.628 23.8687 28.0496 23.7403 28.508 23.7403C28.8563 23.7403 29.223 23.8137 29.6263 23.9787C30.0296 24.1437 30.4513 24.382 30.9096 24.6937L36.978 29.002C37.4546 29.332 37.7846 29.717 37.9863 30.1753C38.1696 30.6337 38.2796 31.092 38.2796 31.6053Z"
          stroke="#292D32"
          strokeWidth="1.5"
          strokeMiterlimit="10"
        />
      </svg>
    ),
    "Chat to support": (
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M31.168 37.5837H12.8346C7.33464 37.5837 3.66797 34.8337 3.66797 28.417V15.5837C3.66797 9.16699 7.33464 6.41699 12.8346 6.41699H31.168C36.668 6.41699 40.3346 9.16699 40.3346 15.5837V28.417C40.3346 34.8337 36.668 37.5837 31.168 37.5837Z" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M31.1654 16.5L25.427 21.0833C23.5387 22.5867 20.4404 22.5867 18.552 21.0833L12.832 16.5" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  const [contactData, setContactData] = useState([]);
  const [socialData, setSocialData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await getContentData("contactUs-page");
        if (response?.body) {
          setContactData(response.body["Contact Us"] || []);
          setSocialData(response.body["Social Contact"] || []);
        }
      } catch (error) {
        // console.error("Failed to fetch contact data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Keeping your mutation block (but contactServices is commented in your code)
  useMutation({
    mutationFn: (payload) => contactServices.contactUs(payload),
  });

  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView />

      <Box mt="90px" py={4} display={{ base: "none", md: "block" }}>
        <Box textAlign="center">
          <Heading
            as="h1"
            fontSize="4xl"
            fontFamily="Dm Serif Display"
            fontWeight="normal"
            textTransform="uppercase"
          >
            Contact Us
          </Heading>
        </Box>
      </Box>

      <Box px={{ md: "50px" }} pt={{ base: 16, md: "50px" }} pb={{ base: 10, md: "77px" }}>
        {/* Contact Cards */}
        <Flex justify="center" gap={{ base: 4, md: 6 }} wrap="wrap">
          {loading ? (
            Array.from({ length: 2 }).map((_, i) => (
              <Box key={i} w="full" maxW="xs">
                <ContactCardShimmer />
              </Box>
            ))
          ) : (
            contactData.map((item, idx) => {
              const titleLower = (item?.Title || "").toLowerCase();
              const isCallUs = titleLower.includes("call");
              const isChatSupport = titleLower.includes("chat");
              const icon = contactIconMap[item.Title];

              if (isMobile && (isCallUs || isChatSupport)) {
                return (
                  <Box key={idx} w="full" maxW="xs">
                    <MobileContactRowCard item={item} icon={icon} getHref={getContactHref} />
                  </Box>
                );
              }

              return (
                <Box key={idx} w="full" maxW="xs">
                  <MobileContactRowCard item={item} icon={icon} getHref={getContactHref} />
                </Box>
              );
            })
          )}
        </Flex>
      </Box>

      <Box pb={10} px={{ base: "12px", md: "50px" }}>
        <Text textAlign="center" fontSize={{ md: "22px" }} textTransform="uppercase" fontWeight="semibold" color="#191616" mb={6}>
          Connect With Social
        </Text>

        <Flex gap={5} justify="center" direction={{ base: "row" }}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Flex key={i} gap={3} align="center">
                <Box className="shimmer" h="24px" w="24px" borderRadius="full" />
                <Box className="shimmer" h="20px" w="200px" display={{ base: "none", md: "block" }} borderRadius="4px" />
              </Flex>
            ))
          ) : (
            socialData.map((platform, i) => (
              <ChakraLink
                key={i}
                as={RouterLink}
                to={platform.href || "#"}
                display="flex"
                alignItems="center"
                gap={3}
                textDecoration="none"
                _hover={{ textDecoration: "none" }}
                target="_blank"
              >
                {socialIconMap[platform.label.toLowerCase()]}
                <Text
                  display={{ base: "none", md: "block" }}
                  fontSize="16px"
                  color="black"
                  borderBottom="1px solid"
                  borderColor="blackAlpha.500"
                  pb="2px"
                >
                  Message us on {platform.label}
                </Text>
              </ChakraLink>
            ))
          )}
        </Flex>
      </Box>

      <Footer />
    </Fragment>
  );
};

export default ContactUs;




// contact form

// import { Fragment, useState, useEffect } from "react";
// import LogoNavbar from "@/components/layouts/LogoNavbar";
// import { Link as RouterLink } from "react-router-dom";
// import { toast } from "react-toastify";
// import { useMutation } from "@tanstack/react-query";
// // import contactServices from "@/api/services/contact";
// import { getContentData } from "@/api/services/homeapi";
// import { useMobile } from "@/components/molecules";
// import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
// import Footer from "@/NewHomePage/components/footer/Footer";
// import {
//   Box,
//   Flex,
//   Heading,
//   Text,
//   Link as ChakraLink,
//   Input as ChakraInput,
//   Textarea as ChakraTextarea,
//   Button,
//   Skeleton,
//   SkeletonCircle,
//   SkeletonText
// } from "@chakra-ui/react";
// import { ContactCardShimmer } from "../Simmers/ContactUsShimmer";

// const MobileContactRowCard = ({ item, icon, getHref }) => {
//   const href = getHref(item.Title, item.Contact);

//   return (
//     <Box
//       w="full"
//       border="1px solid"
//       borderColor="blackAlpha.500"
//       px={4}
//       py={3}
//     >
//       <Flex align="start" justify="space-between" gap={4}>
//         {/* LEFT: icon + title */}
//         <Flex direction="column" align="flex-start" gap={2} flexShrink={0} w={"40%"}>
//           <Box
//             w="50px"
//             h="50px"
//             border="1px solid"
//             borderColor="blackAlpha.500"
//             display="flex"
//             alignItems="center"
//             justifyContent="center"
//           >
//             {icon}
//           </Box>

//           <Text
//             fontSize="sm"
//             fontWeight="semibold"
//             textTransform="capitalize"
//             color="#1d1d1d"
//           >
//             {item.Title}
//           </Text>
//         </Flex>

//         {/* RIGHT: contact + timing/desc */}
//         <Flex direction="column" align="flex-start" textAlign="left" flex="1">
//           <ChakraLink
//             href={href}
//             fontSize="sm"
//             fontWeight="semibold"
//             color="#1d1d1d"
//             borderBottom="1px solid"
//             borderColor="#1d1d1d"
//             pb={0.5}
//             _hover={{ textDecoration: "none" }}
//             target={href.startsWith("http") ? "_blank" : undefined}
//             rel="noreferrer"
//             onClick={(e) => {
//               if (!href || href === "#") {
//                 e.preventDefault();
//                 // toast.info("Contact not available.");
//               }
//             }}
//           >
//             {item.Contact}
//           </ChakraLink>

//           <Text fontSize="xs" color="blackAlpha.600" mt={2}>
//             {item.Description}
//           </Text>
//         </Flex>
//       </Flex>
//     </Box>
//   );
// };



// const normalizePhoneForTel = (val = "") => {
//   // keep + and digits only
//   const cleaned = String(val).trim().replace(/[^\d+]/g, "");
//   return cleaned;
// };

// const getContactHref = (title, contact) => {
//   const t = (title || "").toLowerCase();
//   const c = String(contact || "").trim();

//   if (!c) return "#";

//   // call
//   if (t.includes("call")) {
//     return `tel:${normalizePhoneForTel(c)}`;
//   }

//   // email
//   if (c.includes("@")) {
//     return `mailto:${c}`;
//   }

//   return c; // fallback (if it's already a link)
// };


// const ContactUs = () => {
//   const isMobile = useMobile();
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [phone, setPhone] = useState("");
//   const [message, setMessage] = useState("");

//   const socialIconMap = {
//     instagram: (
//       <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <g clipPath="url(#clip0_289_16994)">
//           <path d="M12 2.66094C15.2063 2.66094 15.5859 2.675 16.8469 2.73125C18.0188 2.78281 18.6516 2.97969 19.0734 3.14375C19.6313 3.35938 20.0344 3.62188 20.4516 4.03906C20.8734 4.46094 21.1313 4.85938 21.3469 5.41719C21.5109 5.83906 21.7078 6.47656 21.7594 7.64375C21.8156 8.90937 21.8297 9.28906 21.8297 12.4906C21.8297 15.6969 21.8156 16.0766 21.7594 17.3375C21.7078 18.5094 21.5109 19.1422 21.3469 19.5641C21.1313 20.1219 20.8688 20.525 20.4516 20.9422C20.0297 21.3641 19.6313 21.6219 19.0734 21.8375C18.6516 22.0016 18.0141 22.1984 16.8469 22.25C15.5813 22.3063 15.2016 22.3203 12 22.3203C8.79375 22.3203 8.41406 22.3063 7.15313 22.25C5.98125 22.1984 5.34844 22.0016 4.92656 21.8375C4.36875 21.6219 3.96563 21.3594 3.54844 20.9422C3.12656 20.5203 2.86875 20.1219 2.65313 19.5641C2.48906 19.1422 2.29219 18.5047 2.24063 17.3375C2.18438 16.0719 2.17031 15.6922 2.17031 12.4906C2.17031 9.28438 2.18438 8.90469 2.24063 7.64375C2.29219 6.47187 2.48906 5.83906 2.65313 5.41719C2.86875 4.85938 3.13125 4.45625 3.54844 4.03906C3.97031 3.61719 4.36875 3.35938 4.92656 3.14375C5.34844 2.97969 5.98594 2.78281 7.15313 2.73125C8.41406 2.675 8.79375 2.66094 12 2.66094ZM12 0.5C8.74219 0.5 8.33438 0.514062 7.05469 0.570312C5.77969 0.626563 4.90313 0.832812 4.14375 1.12812C3.35156 1.4375 2.68125 1.84531 2.01563 2.51562C1.34531 3.18125 0.9375 3.85156 0.628125 4.63906C0.332812 5.40313 0.126563 6.275 0.0703125 7.55C0.0140625 8.83437 0 9.24219 0 12.5C0 15.7578 0.0140625 16.1656 0.0703125 17.4453C0.126563 18.7203 0.332812 19.5969 0.628125 20.3563C0.9375 21.1484 1.34531 21.8188 2.01563 22.4844C2.68125 23.15 3.35156 23.5625 4.13906 23.8672C4.90313 24.1625 5.775 24.3687 7.05 24.425C8.32969 24.4812 8.7375 24.4953 11.9953 24.4953C15.2531 24.4953 15.6609 24.4812 16.9406 24.425C18.2156 24.3687 19.0922 24.1625 19.8516 23.8672C20.6391 23.5625 21.3094 23.15 21.975 22.4844C22.6406 21.8188 23.0531 21.1484 23.3578 20.3609C23.6531 19.5969 23.8594 18.725 23.9156 17.45C23.9719 16.1703 23.9859 15.7625 23.9859 12.5047C23.9859 9.24688 23.9719 8.83906 23.9156 7.55938C23.8594 6.28438 23.6531 5.40781 23.3578 4.64844C23.0625 3.85156 22.6547 3.18125 21.9844 2.51562C21.3188 1.85 20.6484 1.4375 19.8609 1.13281C19.0969 0.8375 18.225 0.63125 16.95 0.575C15.6656 0.514063 15.2578 0.5 12 0.5Z" fill="#1D1D1D" />
//           <path d="M12 6.33594C8.59688 6.33594 5.83594 9.09688 5.83594 12.5C5.83594 15.9031 8.59688 18.6641 12 18.6641C15.4031 18.6641 18.1641 15.9031 18.1641 12.5C18.1641 9.09688 15.4031 6.33594 12 6.33594ZM12 16.4984C9.79219 16.4984 8.00156 14.7078 8.00156 12.5C8.00156 10.2922 9.79219 8.50156 12 8.50156C14.2078 8.50156 15.9984 10.2922 15.9984 12.5C15.9984 14.7078 14.2078 16.4984 12 16.4984Z" fill="#1D1D1D" />
//           <path d="M19.8469 6.09238C19.8469 6.88926 19.2 7.53145 18.4078 7.53145C17.6109 7.53145 16.9688 6.88457 16.9688 6.09238C16.9688 5.29551 17.6156 4.65332 18.4078 4.65332C19.2 4.65332 19.8469 5.3002 19.8469 6.09238Z" fill="#1D1D1D" />
//         </g>
//         <defs>
//           <clipPath id="clip0_289_16994">
//             <rect width="24" height="24" fill="white" transform="translate(0 0.5)" />
//           </clipPath>
//         </defs>
//       </svg>
//     ),
//     facebook: (
//       <svg width="24" height="25" viewBox="0 0 24 25" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <path d="M12 0.5C5.37264 0.5 0 5.87264 0 12.5C0 18.1275 3.87456 22.8498 9.10128 24.1467V16.1672H6.62688V12.5H9.10128V10.9198C9.10128 6.83552 10.9498 4.9424 14.9597 4.9424C15.72 4.9424 17.0318 5.09168 17.5685 5.24048V8.56448C17.2853 8.53472 16.7933 8.51984 16.1822 8.51984C14.2147 8.51984 13.4544 9.26528 13.4544 11.203V12.5H17.3741L16.7006 16.1672H13.4544V24.4122C19.3963 23.6946 24.0005 18.6354 24.0005 12.5C24 5.87264 18.6274 0.5 12 0.5Z" fill="#1D1D1D" />
//       </svg>
//     ),
//     twitter: (
//       <svg width="22" height="21" viewBox="0 0 22 21" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <path d="M17.3263 0.404297H20.6998L13.3297 8.82779L22 20.2903H15.2112L9.89404 13.3383L3.80995 20.2903H0.434432L8.31743 11.2804L0 0.404297H6.96111L11.7674 6.75863L17.3263 0.404297ZM16.1423 18.2711H18.0116L5.94539 2.31743H3.93946L16.1423 18.2711Z" fill="#1D1D1D" />
//       </svg>
//     ),
//   };

//   const contactIconMap = {
//     "Call us": (
//       <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <path
//           d="M38.2796 31.6053C38.2796 32.2653 38.133 32.9437 37.8213 33.6037C37.5096 34.2637 37.1063 34.887 36.5746 35.4737C35.6763 36.4637 34.6863 37.1787 33.568 37.637C32.468 38.0953 31.2763 38.3337 29.993 38.3337C28.123 38.3337 26.1246 37.8937 24.0163 36.9953C21.908 36.097 19.7996 34.887 17.7096 33.3653C15.6013 31.8253 13.603 30.1203 11.6963 28.232C9.80797 26.3253 8.10297 24.327 6.5813 22.237C5.07797 20.147 3.86797 18.057 2.98797 15.9853C2.10797 13.8953 1.66797 11.897 1.66797 9.99033C1.66797 8.74366 1.88797 7.55199 2.32797 6.45199C2.76797 5.33366 3.46464 4.30699 4.4363 3.39033C5.60964 2.23533 6.89297 1.66699 8.24964 1.66699C8.76297 1.66699 9.2763 1.77699 9.73464 1.99699C10.2113 2.21699 10.633 2.54699 10.963 3.02366L15.2163 9.01866C15.5463 9.47699 15.7846 9.89866 15.9496 10.302C16.1146 10.687 16.2063 11.072 16.2063 11.4203C16.2063 11.8603 16.078 12.3003 15.8213 12.722C15.583 13.1437 15.2346 13.5837 14.7946 14.0237L13.4013 15.472C13.1996 15.6737 13.108 15.912 13.108 16.2053C13.108 16.352 13.1263 16.4803 13.163 16.627C13.218 16.7737 13.273 16.8837 13.3096 16.9937C13.6396 17.5987 14.208 18.387 15.0146 19.3403C15.8396 20.2937 16.7196 21.2653 17.673 22.237C18.663 23.2087 19.6163 24.107 20.588 24.932C21.5413 25.7387 22.3296 26.2887 22.953 26.6187C23.0446 26.6553 23.1546 26.7103 23.283 26.7653C23.4296 26.8203 23.5763 26.8387 23.7413 26.8387C24.053 26.8387 24.2913 26.7287 24.493 26.527L25.8863 25.152C26.3446 24.6937 26.7846 24.3453 27.2063 24.1253C27.628 23.8687 28.0496 23.7403 28.508 23.7403C28.8563 23.7403 29.223 23.8137 29.6263 23.9787C30.0296 24.1437 30.4513 24.382 30.9096 24.6937L36.978 29.002C37.4546 29.332 37.7846 29.717 37.9863 30.1753C38.1696 30.6337 38.2796 31.092 38.2796 31.6053Z"
//           stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10"
//         />
//       </svg>
//     ),
//     "Chat to support": (
//       <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
//         <path d="M31.168 37.5837H12.8346C7.33464 37.5837 3.66797 34.8337 3.66797 28.417V15.5837C3.66797 9.16699 7.33464 6.41699 12.8346 6.41699H31.168C36.668 6.41699 40.3346 9.16699 40.3346 15.5837V28.417C40.3346 34.8337 36.668 37.5837 31.168 37.5837Z" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
//         <path d="M31.1654 16.5L25.427 21.0833C23.5387 22.5867 20.4404 22.5867 18.552 21.0833L12.832 16.5" stroke="#292D32" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round" />
//       </svg>
//     )
//   };

//   const [contactData, setContactData] = useState([]);
//   const [socialData, setSocialData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);
//         const response = await getContentData('contactUs-page');
//         if (response?.body) {
//           setContactData(response.body['Contact Us'] || []);
//           setSocialData(response.body['Social Contact'] || []);
//         }
//       } catch (error) {
//         console.error("Failed to fetch contact data", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const { mutate: contactUs, isPending } = useMutation({
//     mutationFn: (payload) => contactServices.contactUs(payload),
//     onSuccess: (data) => {
//       // toast.success(data.message || "Message sent successfully!");
//       setName("");
//       setEmail("");
//       setPhone("");
//       setMessage("");
//     },
//     onError: () => {
//       // toast.error("Please fill all the required fields.");
//     },
//   });

//   const handleSubmit = () => {
//     contactUs({ name, email, phone, message });
//   };


//   return (
//     <Fragment>
//       <LogoNavbar />
//       <CartQuickView />

//       <Box mt="90px" py={4} display={{ base: "none", md: "block" }}>
//         <Box textAlign="center">
//           <Heading
//             as="h1"
//             fontSize="4xl"
//             fontFamily="Dm Serif Display"
//             fontWeight="normal"
//             textTransform={"uppercase"}
//           >
//             Contact Us
//           </Heading>
//         </Box>
//       </Box>

//       <Box px={{ md: "50px" }} pt={{ base: 16, md: "50px" }} pb={{ base: 10, md: "77px" }}>
//         {/* Contact Cards */}
//         <Flex justify="center" gap={{ base: 4, md: 6 }} wrap="wrap">
//           {loading ? (
//             <>
//               {/* MOBILE shimmer */}
//               <Box w="full" maxW="xs">
//                 <Flex direction={{ base: "column", md: "row" }} gap={4}>
//                   {Array.from({ length: 2 }).map((_, i) => (
//                     <Box key={i} w="full" maxW="xs">
//                       <ContactCardShimmer />
//                     </Box>
//                   ))}
//                 </Flex>
//               </Box>
//             </>
//           ) : (
//             contactData.map((item, idx) => {
//               const titleLower = (item?.Title || "").toLowerCase();
//               const isCallUs = titleLower.includes("call");
//               const isChatSupport = titleLower.includes("chat");
//               const icon = contactIconMap[item.Title];

//               // ✅ MOBILE: "Call us" + "Chat to support" -> same row layout
//               if (isMobile && (isCallUs || isChatSupport)) {
//                 return (
//                   <Box key={idx} w="full" maxW="xs">
//                     <MobileContactRowCard
//                       item={item}
//                       icon={icon}
//                       getHref={getContactHref}
//                     />
//                   </Box>
//                 );
//               }

//               // ✅ Otherwise: your existing card layout (same as you already have)
//               return (
//                 <Box
//                   key={idx}
//                   w="full"
//                   maxW="xs"
//                 >
//                   <MobileContactRowCard
//                     item={item}
//                     icon={icon}
//                     getHref={getContactHref}
//                   />
//                 </Box>
//               );
//             })

//           )}
//         </Flex>
//       </Box>

//       <Box borderBottom="1px solid" borderColor="blackAlpha.500" pb={10} px={{ base: "12px", md: "50px" }}>
//         <Text textAlign="center" fontSize={{ md: "22px" }} textTransform="uppercase" fontWeight="semibold" color="#191616" mb={6}>
//           Connect With Social
//         </Text>

//         <Flex gap={5} justify="center" direction={{ base: "row" }}>
//           {loading ? (
//             Array.from({ length: 3 }).map((_, i) => (
//               <Flex key={i} gap={3} align="center">
//                 <Box className="shimmer" height="24px" width="24px" borderRadius="full" />
//                 <Box className="shimmer" height="20px" width="200px" />
//               </Flex>
//             ))
//           ) : (
//             socialData.map((platform, i) => (
//               <ChakraLink
//                 key={i}
//                 as={RouterLink}
//                 to={(platform.href) || "#"}
//                 display="flex"
//                 alignItems="center"
//                 gap={3}
//                 textDecoration="none"
//                 _hover={{ textDecoration: "none" }}
//                 target="_blank"
//               >
//                 {socialIconMap[platform.label.toLowerCase()]}
//                 <Text display={{ base: "none", md: "block" }} fontSize="16px" color="black" borderBottom="1px solid" borderColor="blackAlpha.500" pb="2px">
//                   Message us on {platform.label}
//                 </Text>
//               </ChakraLink>
//             ))
//           )}
//         </Flex>
//       </Box>

//       {/* <Box py={12} borderTop="1px solid" borderColor="blackAlpha.500" px={{ base: "12px", md: "50px" }}>
//         <Flex direction={{ base: "column", lg: "row" }} justify="space-between" gap={10}>
//           <Box w={{ lg: "66.6667%" }}>
//             <Text fontSize="22px" textTransform="uppercase" fontWeight="semibold" color="#191616" mb={6}>
//               Have a Queries?
//             </Text>

//             <Flex direction="column" gap={3}>
//               <Flex direction={{ base: "column", md: "row" }} gap={3}>
//                 <ChakraInput
//                   type="text"
//                   placeholder="Name"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   w="full"
//                   p={3}
//                   border="1px solid"
//                   borderColor="blackAlpha.500"
//                   fontSize="sm"
//                   color="#535151"
//                   _placeholder={{ color: "blackAlpha.500" }}
//                   _focus={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _focusVisible={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _hover={{
//                     borderColor: "blackAlpha.500",
//                     boxShadow: "none",
//                   }}
//                   borderRadius="0"
//                 />
//                 <ChakraInput
//                   type="text"
//                   placeholder="Mobile Number"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   w="full"
//                   p={3}
//                   border="1px solid"
//                   borderColor="blackAlpha.500"
//                   fontSize="sm"
//                   color="#535151"
//                   _placeholder={{ color: "blackAlpha.500" }}
//                   _focus={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _focusVisible={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _hover={{
//                     borderColor: "blackAlpha.500",
//                     boxShadow: "none",
//                   }}
//                   borderRadius="0"
//                 />
//               </Flex>

//               <ChakraInput
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 w="full"
//                 p={3}
//                 border="1px solid"
//                 borderColor="blackAlpha.500"
//                 fontSize="sm"
//                 color="#535151"
//                 _placeholder={{ color: "blackAlpha.500" }}
//                 _focus={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _focusVisible={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _hover={{
//                   borderColor: "blackAlpha.500",
//                   boxShadow: "none",
//                 }}
//                 borderRadius="0"
//               />

//               <ChakraTextarea
//                 rows={7}
//                 placeholder="Your message..."
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 w="full"
//                 p={3}
//                 border="1px solid"
//                 borderColor="blackAlpha.500"
//                 fontSize="sm"
//                 color="#535151"
//                 _placeholder={{ color: "blackAlpha.500" }}
//                 _focus={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _focusVisible={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _hover={{
//                   borderColor: "blackAlpha.500",
//                   boxShadow: "none",
//                 }}
//                 borderRadius="0"
//               />
//             </Flex>

//             <Button
//               onClick={handleSubmit}
//               isDisabled={isPending}
//               bg="#1d1d1d"
//               color="white"
//               textTransform="uppercase"
//               fontSize="sm"
//               fontWeight="medium"
//               py={2}
//               w="full"
//               mt={6}
//               _hover={{ bg: "#1d1d1d" }}
//               borderRadius="0"
//             >
//               {isPending ? "Sending..." : "Send Message"}
//             </Button>
//           </Box>

//           <Box w={{ lg: "33.3333%" }}>
//             <Text fontSize="22px" textTransform="uppercase" fontWeight="semibold" color="#191616" mb={6}>
//               Connect With Social
//             </Text>

//             <Flex gap={5} direction={{ base: "row", md: "column" }}>
//               {loading ? (
//                 Array.from({ length: 3 }).map((_, i) => (
//                   <Flex key={i} gap={3} align="center">
//                     <SkeletonCircle size="24px" />
//                     <Skeleton height="20px" width="200px" />
//                   </Flex>
//                 ))
//               ) : (
//                 socialData.map((platform, i) => (
//                   <ChakraLink
//                     key={i}
//                     as={RouterLink}
//                     to={(platform.href) || "#"}
//                     display="flex"
//                     alignItems="center"
//                     gap={3}
//                     textDecoration="none"
//                     _hover={{ textDecoration: "none" }}
//                     target="_blank"
//                   >
//                     {socialIconMap[platform.label.toLowerCase()]}
//                     <Text display={{ base: "none", md: "block" }} fontSize="16px" color="black" borderBottom="1px solid" borderColor="blackAlpha.500" pb="2px">
//                       Message us on {platform.label}
//                     </Text>
//                   </ChakraLink>
//                 ))
//               )}
//             </Flex>
//           </Box>
//         </Flex>
//       </Box> */}


//       {/* <Box py={12} borderTop="1px solid" borderColor="blackAlpha.500" px={{ base: "12px", md: "50px" }}>
//         <Flex direction={{ base: "column", lg: "row" }} justify="space-between" gap={10}>
//           <Box w={{ lg: "66.6667%" }}>
//             <Text fontSize="22px" textTransform="uppercase" fontWeight="semibold" color="#191616" mb={6}>
//               Have a Queries?
//             </Text>

//             <Flex direction="column" gap={3}>
//               <Flex direction={{ base: "column", md: "row" }} gap={3}>
//                 <ChakraInput
//                   type="text"
//                   placeholder="Name"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                   w="full"
//                   p={3}
//                   border="1px solid"
//                   borderColor="blackAlpha.500"
//                   fontSize="sm"
//                   color="#535151"
//                   _placeholder={{ color: "blackAlpha.500" }}
//                   _focus={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _focusVisible={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _hover={{
//                     borderColor: "blackAlpha.500",
//                     boxShadow: "none",
//                   }}
//                   borderRadius="0"
//                 />
//                 <ChakraInput
//                   type="text"
//                   placeholder="Mobile Number"
//                   value={phone}
//                   onChange={(e) => setPhone(e.target.value)}
//                   w="full"
//                   p={3}
//                   border="1px solid"
//                   borderColor="blackAlpha.500"
//                   fontSize="sm"
//                   color="#535151"
//                   _placeholder={{ color: "blackAlpha.500" }}
//                   _focus={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _focusVisible={{
//                     boxShadow: "none",
//                     outline: "none",
//                     borderColor: "blackAlpha.500",
//                   }}
//                   _hover={{
//                     borderColor: "blackAlpha.500",
//                     boxShadow: "none",
//                   }}
//                   borderRadius="0"
//                 />
//               </Flex>

//               <ChakraInput
//                 type="email"
//                 placeholder="Email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 w="full"
//                 p={3}
//                 border="1px solid"
//                 borderColor="blackAlpha.500"
//                 fontSize="sm"
//                 color="#535151"
//                 _placeholder={{ color: "blackAlpha.500" }}
//                 _focus={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _focusVisible={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _hover={{
//                   borderColor: "blackAlpha.500",
//                   boxShadow: "none",
//                 }}
//                 borderRadius="0"
//               />

//               <ChakraTextarea
//                 rows={7}
//                 placeholder="Your message..."
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 w="full"
//                 p={3}
//                 border="1px solid"
//                 borderColor="blackAlpha.500"
//                 fontSize="sm"
//                 color="#535151"
//                 _placeholder={{ color: "blackAlpha.500" }}
//                 _focus={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _focusVisible={{
//                   boxShadow: "none",
//                   outline: "none",
//                   borderColor: "blackAlpha.500",
//                 }}
//                 _hover={{
//                   borderColor: "blackAlpha.500",
//                   boxShadow: "none",
//                 }}
//                 borderRadius="0"
//               />
//             </Flex>

//             <Button
//               onClick={handleSubmit}
//               isDisabled={isPending}
//               bg="#1d1d1d"
//               color="white"
//               textTransform="uppercase"
//               fontSize="sm"
//               fontWeight="medium"
//               py={2}
//               w="full"
//               mt={6}
//               _hover={{ bg: "#1d1d1d" }}
//               borderRadius="0"
//             >
//               {isPending ? "Sending..." : "Send Message"}
//             </Button>
//           </Box>

//         </Flex>
//       </Box> */}
//       <Footer />
//     </Fragment>
//   );
// };

// export default ContactUs;
