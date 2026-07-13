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

const PrivacyPolicy = () => {
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
            Privacy Policy
          </Heading>
        </Box>
      </Box>

      {/* Main Content */}
      <Box my="50px" px={isMobile ? "12px" : "50px"} pt={{ base: 2, md: 0}} pb={0}>
        <Box pb={4} borderBottom="1px solid" borderColor="blackAlpha.500" mt={4}>
          <Text>At Sotbella, we value your trust and are committed to protecting your privacy. This Privacy Policy outlines how your personal information is collected, used, shared, and safeguarded when you interact with Sotbella through our website, mobile app, or other platforms.</Text>
        </Box>

        <Section title="1. Information We Collect">
          <Text>We collect the following types of information to provide and improve our services:</Text>
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
            <ListItem>
              <Text as="span" fontWeight="semibold">Personal Information:</Text> Name, email address, phone number, billing and shipping addresses, payment details, and account credentials.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Browsing Information:</Text> IP address, device details, browser type, and activity on our website or app.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Transaction Information:</Text> Purchase history, preferences, and feedback.
            </ListItem>
            <ListItem>
              <Text as="span" fontWeight="semibold">Cookies and Similar Technologies:</Text> To enhance user experience and personalize your journey.
            </ListItem>
          </UnorderedList>
        </Section>

        <Section title="2. How We Use Your Information">
          <Text>
            Your information is used for:
          </Text>
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
            <ListItem>Processing your orders and managing your account.</ListItem>
            <ListItem>Providing customer support and resolving issues.</ListItem>
            <ListItem>Sending updates, promotional offers, and marketing communications (with your consent).</ListItem>
            <ListItem>Improving website/app performance and tailoring content.</ListItem>
            <ListItem>Ensuring security and preventing fraudulent activities.</ListItem>
          </UnorderedList>
        </Section>

        <Section title="3. Sharing Your Information">
          <Text>
            We do not sell your personal information. However, your data may be shared with trusted third parties for:
          </Text>
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
            <ListItem>Payment processing and order delivery.</ListItem>
            <ListItem>Marketing and analytics to improve our services.</ListItem>
            <ListItem>Legal compliance, such as responding to lawful requests.</ListItem>
          </UnorderedList>
        </Section>

        <Section title="4. Security Measures">
          <Text>
            We employ advanced security measures to protect your information, including encryption, secure servers, and regular audits. However, no system is entirely foolproof, so we encourage you to take precautions when sharing sensitive information online.
          </Text>
        </Section>

        <Section title="5. Cookies Policy">
          <Text>
            Cookies help us improve your experience. You can manage or disable cookies through your browser settings, but doing so may limit certain functionalities of our platform.
          </Text>
        </Section>

        <Section title="6. Data Retention">
          <Text>We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy or as required by law.</Text>
        </Section>

        <Section title="7. Your Rights">
          <Text>
            You have the right to:
          </Text>
          <UnorderedList styleType="disc" ml={4} mt={2} spacing={2} fontSize="sm">
            <ListItem>Access, update, or delete your personal information.</ListItem>
            <ListItem>Opt out of receiving marketing communications.</ListItem>
            <ListItem>Request details about how your information is processed.</ListItem>
          </UnorderedList>
          <Text mt={2}>
            To exercise these rights, contact us at support@sotbella.com.
          </Text>
        </Section>

        <Section title="8. Children's Privacy">
          <Text>
            Sotbella does not knowingly collect personal information from children under the age of 13. If we become aware that a child has provided us with personal data, we will take steps to delete such information.
          </Text>
        </Section>

        <Section title="9. Changes to the Privacy Policy">
          <Text>
            We may update this policy from time to time. Changes will be posted on our website or app, and your continued use of our services implies acceptance of the revised terms.
          </Text>
        </Section>

        <Section title="10. Contact Us">
          <Text>
            For any queries or concerns regarding this Privacy Policy, please contact:
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

export default PrivacyPolicy;
