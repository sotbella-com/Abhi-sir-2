import React from "react";
import { Box, Container } from "@chakra-ui/react";
import LogoNavbar from "@/components/layouts/LogoNavbar";
import Footer from "@/NewHomePage/components/footer/Footer";

const Login = () => {
  return (
    <>
      {/* Top navigation */}
      <LogoNavbar />

      {/* Page body */}
      <Box as="main" position="relative" pt={{ base: 8, md: 10 }}>
        

        {/* Footer area */}
        <Box mt={{ base: 10, md: 14 }}>
          <Footer />
        </Box>
      </Box>
    </>
  );
};

export default Login;
