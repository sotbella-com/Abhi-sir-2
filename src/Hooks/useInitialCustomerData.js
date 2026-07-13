import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useWishlistStore } from "@/context/wishlistStore";
import { useAddressStore } from "@/context";

export const useInitialCustomerData = () => {
  const { isAuthenticated, user } = useAuth();
  const fetchAddress = useAddressStore((state) => state.fetchAddress);
  const fetchWishlist = useWishlistStore((state) => state.fetchWishlist);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          fetchWishlist({ customerId: user?.id }),
          fetchAddress({ customerId: user?.id }),
        ]);
      } catch (error) {
      }
    };

    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated]);
};
