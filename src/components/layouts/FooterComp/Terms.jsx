import { Fragment } from "react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import { useMobile } from "@/components/molecules";
import CartQuickView from "@/pages/ProductDetails/components/cartQuickView";
import Footer from "@/NewHomePage/components/footer/Footer";
import {
  Box,
  Heading,
  Text,
  UnorderedList,
  ListItem,
} from "@chakra-ui/react";

const Terms = () => {
  const isMobile = useMobile();

  return (
    <Fragment>
      <LogoNavbar />
      <CartQuickView />

      {/* Header Section */}
      <Box
        display={{ base: "none", md: "block" }}
        mt="90px"
        py={4}
      >
        <Box textAlign="center">
          <Heading
            as="h1"
            fontSize="4xl"
            fontWeight="normal"
            fontFamily="Dm Serif Display"
            textTransform={"uppercase"}
          >
            Terms & Conditions
          </Heading>
        </Box>
      </Box>

      {/* Main Content */}
      <Box my="50px" px={isMobile ? "12px" : "50px"} pt={{ base: 2, md: 0}} pb={0}>
        <Box pb={4} borderBottom="1px solid" borderColor="blackAlpha.500" mt={4}>
          <Text>Welcome to Sotbella! These Terms of Service ("Terms") govern your use of our website, mobile app, and any other platforms (collectively referred to as "Services") provided by Sotbella, a brand of Globolosys Fashion Private Limited. By using our Services, you agree to these Terms.</Text>
        </Box>

        <Section title="1. Acceptance of Terms">
          <Text>By accessing or using Sotbella's Services, you agree to comply with and be bound by these Terms. If you do not agree with any part of these Terms, you should not use our Services.</Text>
        </Section>

        <Section title="2. Use of Services">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Eligibility:</Text> To use our Services, you must be at least 18 years of age or have parental consent.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Account:</Text> You may be required to create an account to make purchases or access certain features. You agree to provide accurate and complete information when creating an account and to update it as necessary.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Account Responsibility:</Text> You are responsible for maintaining the confidentiality of your account and password. You agree to notify us immediately of any unauthorized access or security breaches.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="3. Products and Pricing">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Product Information:</Text> While we strive to provide accurate product information, Sotbella does not guarantee that all descriptions, images, or prices are error-free. We reserve the right to correct any inaccuracies.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Pricing:</Text> Prices for products may change without notice. All prices are in INR or the relevant currency for international transactions and include taxes unless specified otherwise.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Availability:</Text> We cannot guarantee product availability. If an item is out of stock, we will notify you and offer alternatives or a refund.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="4. Order Process">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Placing an Order:</Text> When you place an order with Sotbella, you are making an offer to purchase items subject to these Terms. Your order will be confirmed once we process it, and you will receive an order confirmation email.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Order Cancellation:</Text> We reserve the right to cancel or refuse any order, including due to issues with payment processing, shipping errors, or suspected fraud.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="5. Payment">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Payment Methods:</Text> We accept various payment methods, including credit/debit cards, net banking, and digital wallets.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Security:</Text> Your payment information is securely processed using encryption technologies. Sotbella does not store your sensitive payment details.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="6. Shipping and Delivery">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Shipping Policy:</Text> We ship to various locations. Shipping charges, delivery times, and tracking information are provided at checkout.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Customs and Duties (International Orders):</Text> For international shipments, any customs duties or taxes are the responsibility of the customer.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="7. Returns and Exchanges">
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Return Policy:</Text> If you are not satisfied with your purchase, you may return it within the specified return period. Please refer to our Return and Exchange Policy for detailed information.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Exchanges:</Text> We offer exchanges for items in new, unused condition within the return window.
            </ListItem>
            </UnorderedList>
        </Section>

        <Section title="8. Intellectual Property">
          <Text>
            All content, including but not limited to logos, text, images, videos, and software, on the Sotbella website and app is the property of Sotbella and is protected by copyright, trademark, and other intellectual property laws. You may not use or reproduce any of our content without permission.
          </Text>
        </Section>

        <Section title="9. Privacy">
          <Text>
            Your privacy is important to us. Our Privacy Policy outlines how we collect, use, and protect your personal information. By using our Services, you agree to the terms of the Privacy Policy.
          </Text>
        </Section>

        <Section title="10. Limitation of Liability">
          <Text>
            Sotbella is not liable for any indirect, incidental, special, or consequential damages arising from the use or inability to use our Services. We do not guarantee that our Services will be error-free or uninterrupted.
          </Text>
        </Section>

        <Section title="11. Governing Law">
          <Text>
            These Terms shall be governed by and construed in accordance with the laws of India. Any disputes related to these Terms will be subject to the jurisdiction of the courts in [Insert Location].
          </Text>
        </Section>

        <Section title="12. Changes to Terms">
          <Text>
            We reserve the right to update or modify these Terms at any time. Any changes will be posted on this page with an updated "Last Updated" date. Continued use of our Services after any changes constitutes acceptance of the revised Terms.
          </Text>
        </Section>

        <Section title="13. Contact Us">
          <Text>
            If you have any questions or concerns regarding these Terms of Service, please contact us at:
          </Text>
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
          <ListItem>
              <Text as="span" fontWeight="semibold">Email:</Text> support@sotbella.com
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Phone:</Text> +91 9773981621
            </ListItem>
            </UnorderedList>
        </Section>

        <Box mt={6}>
          <Heading as="h2" fontSize="lg" fontWeight="semibold" color="#212529" mb={5}>
            Stay Stylish, Stay Secure! <br />
            Team Sotbella
          </Heading>
        </Box>
      </Box>

      <Footer />
    </Fragment>
  );
};

const Section = ({ title, children }) => (
  <Box
    pb={{ base: 4, md: 6 }}
    borderBottom="1px solid"
    borderColor="blackAlpha.500"
    mt={{ base: 4, md: 6 }}
  >
    <Heading
      as="h3"
      fontSize={{ base: "md", md: "lg" }}
      fontWeight="semibold"
      color="#212529"
    >
      {title}
    </Heading>
    <Box fontSize="sm" color="#212529" lineHeight="tall" mt={{ base: 2, md: 4 }}>
      {children}
    </Box>
  </Box>
);

export default Terms;
