import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./App.css";
import './css/Shimmer.css';
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// Import storage debugger, cleaner, and cleanup script in development
if (import.meta.env.DEV) {
  import('./utils/storageDebugger.js');
  import('./utils/localStorageCleaner.js');
  import('./utils/cleanupScript.js');
}

// Clean up legacy token keys on app initialization
import { migrateLegacyTokens } from './utils/tokenCleanup.js';
migrateLegacyTokens();

// Import Evergage helper for debugging and tracking
import('./utils/evergageHelper.js');
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Thankyou from "./pages/Cart/Thankyou/Thankyou.jsx";
import Wallet from "./pages/profile/Wallet.jsx";
import Coupons from "./pages/profile/Coupons.jsx";
import Acaddress from "./pages/profile/Acaddress.jsx";
import Addaddress from "./pages/profile/Addaddress.jsx";
import {
  AboutUs,
  ContactUs,
  Testimonials,
} from "./components/layouts/index.jsx";
import MobileAcount from "./pages/profile/MobileAcount.jsx";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import EditAddress from "./pages/profile/EditAddress.jsx";
import EditShippingAddress from "./pages/Shipping/EditShippingAddress.jsx";
import VerifyOTP from "./pages/Auth/VerifyOTP.jsx";
import CreateAccount from "./pages/Auth/CreateAccount.jsx";
import MainLoginPage from "./pages/Auth/MainLoginPage.jsx";
import PrivateRoute from "./Hooks/PrivateRoute/PrivateRoute.jsx";
import AuthTokenRoute from "./Hooks/PrivateRoute/AuthTokenRoute.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import NavSearch from "./pages/home/Search/NavSearch.jsx";
import Login from "./pages/CartLogin/Login.jsx";
import ScrollToTop from "./components/atoms/ScrollToTop.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import AyraShopper from "./ayra/AyraShopper.jsx";
import AyraLanding from "./ayra/AyraLanding.jsx";
import ShowroomLanding from "./ayra/ShowroomLanding.jsx";
import ProductDetails from "./pages/ProductDetails/index.jsx";
import ProductImageGallery from "./pages/ProductDetails/components/productImageGallery.jsx";
import MyWishList from "./pages/WishList/index.jsx";
import CategoryPage from "./pages/Category/index.jsx";
import ProfilePage from "./pages/profile/myAccount.jsx";
import Order from "./pages/profile/orders/index.jsx";
import OrderSummary from "./pages/profile/orders/orderDetails.jsx";
import CartPage from "./pages/Cart/index.jsx";
import Shipping from "./pages/Shipping/index.jsx";
import AddressPage from "./pages/address/index.jsx";
import ReturnExchangePage from "./pages/returnExchange/index.jsx";
import ReturnExchangeForm from "./pages/returnExchange/components/ReturnExchangeForm.jsx";
import { useInitialCustomerData } from "./Hooks/useInitialCustomerData.js";
import TrackOrderPage from "./pages/TrackOrder/index.jsx";
import ThankyouScreen from "./pages/thankyou/index.jsx";
import NewHome from "./NewHome.jsx";
import { ChakraProvider } from "@chakra-ui/react";
import theme from "../theme.js";
import { FooterProvider } from "./Hooks/FooterContext.jsx";
import Sizeguidepage from "./components/SizeGuide/SizeGuidePage.jsx";
import FaqPage from "./components/Faqpage/FaqPage.jsx";
import NetworkWrapper from "./utils/NetworkWrapper.jsx";
import HiddenUserData from "./components/atoms/HiddenUserData.jsx";
import RatingReviewForm from "./pages/ProductDetails/components/RatingReviewForm.jsx";
import ExchangeAllProductsPage from "./pages/returnExchange/pages/ExchangeAllProductsPage.jsx";
import ExchangeCheckout from "./pages/returnExchange/ExchangeCheckout.jsx";
import Policies from "./components/layouts/FooterComp/Policies.jsx";
import useNitro from "./Hooks/useNitro.js";

// ✅ Performance Optimization: Configure React Query with caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - data considered fresh
      cacheTime: 10 * 60 * 1000, // 10 minutes - cache persists
      refetchOnWindowFocus: false, // Don't refetch on window focus
      retry: 1, // Only retry once on failure
      refetchOnMount: false, // Use cache if data is fresh
    },
  },
});

function MainLayout() {
  useInitialCustomerData();
  useNitro();

  return (
    <>
      <Outlet />
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <NetworkWrapper>
    <ChakraProvider theme={theme}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ToastContainer
            position="top-center"
            autoClose={2000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick={true}
            rtl={false}
            pauseOnFocusLoss
            draggable={false}
            pauseOnHover
            theme="light"
            toastStyle={{
              backgroundColor: "white",
              color: "#333",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
            }}
          />
          <ScrollToTop />
          <AuthProvider>
            <FooterProvider>
              <HiddenUserData />
              <Routes>
                {/* AYRA ad-landing — chrome-free, outside MainLayout. The global
                    <AyraShopper/> auto-opens its orb here and styles for the ad. */}
                <Route path="/ayra" element={<AyraLanding />} />
                {/* AYRA Showroom — persona test surface; activates showroom mode
                    then drops into the real store (chrome-free, outside MainLayout). */}
                <Route path="/showroom" element={<ShowroomLanding />} />
                <Route element={<MainLayout />}>
                  {/* Public Pages */}
                  <Route path="/" element={<App />} />
                  <Route path="/search" element={<NavSearch />} />
                  <Route path="/search/:categoryId" element={<NavSearch />} />
                  <Route path="/category/:categoryId" element={<CategoryPage />} />
                  <Route path="/product/:id" element={<ProductDetails />} />
                  <Route path="/product-images/:id" element={<ProductImageGallery />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/:slug" element={<Policies />} />
                  <Route path="/sizeguide" element={<Sizeguidepage />} />
                  <Route path="/aboutus" element={<AboutUs />} />
                  <Route path="/contactus" element={<ContactUs />} />
                  <Route path="/testimonial" element={<Testimonials />} />
                  <Route path="/faq" element={<FaqPage />} />
                  {/* <Route path="/returnexchange" element={<ReturnExchangePage />} /> */}
                  <Route path="/greetthankyou" element={<ThankyouScreen />} />
                  {/* <Route path="/returnexchange/:orderId" element={<ReturnExchangeForm />} /> */}
                  <Route path="/trackorder" element={<TrackOrderPage />} />
                  <Route path="/thankyou" element={<Thankyou />} />
                  <Route path="/rating-review" element={<RatingReviewForm />} />
                  <Route path="/shipping" element={<Shipping />} />

                  {/* Auth Pages - should NOT be protected */}
                  <Route element={<AuthTokenRoute />}>
                    <Route path="/main-login" element={<MainLoginPage />} />
                    <Route path="/create-account" element={<CreateAccount />} />
                    <Route path="/verify-otp" element={<VerifyOTP />} />
                    <Route path="/login" element={<Login />} />
                  </Route>

                  {/* Private Routes - Requires login */}
                  <Route element={<PrivateRoute />}>
                    <Route path="/manage-profile" element={<ProfilePage />} />
                    <Route path="/wishlist" element={<MyWishList />} />
                    <Route path="/mobileacount" element={<MobileAcount />} />
                    <Route path="/order" element={<Order />} />
                    <Route path="/ordersummary/:id" element={<OrderSummary />} />
                    <Route path="/wallet" element={<Wallet />} />
                    <Route path="/coupons" element={<Coupons />} />
                    <Route path="/customer-address" element={<Acaddress />} />
                    <Route path="/add-address" element={<Addaddress />} />
                    <Route path="/edit-address/:id" element={<EditAddress />} />
                    {/* <Route path="/shipping" element={<Shipping />} /> */}
                    <Route path="/address" element={<AddressPage />} />
                    <Route path="/returnexchange" element={<ReturnExchangePage />} />
                    <Route path="/returnexchange/:orderId" element={<ReturnExchangeForm />} />
                    <Route path="/exchange/:basketId" element={<ExchangeCheckout />} />
                    <Route path="/category/exchange-products" element={<ExchangeAllProductsPage />} />
                    <Route
                      path="/edit-shipping-address/:id"
                      element={<EditShippingAddress />}
                    />
                  </Route>
                </Route>
              </Routes>
              {/* AYRA native voice shopper — floating, site-wide (sandbox-gated) */}
              <AyraShopper />
            </FooterProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ChakraProvider>
  </NetworkWrapper>
);

