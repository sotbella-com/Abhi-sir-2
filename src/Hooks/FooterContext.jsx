import React, { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchHomePageContent } from "@/api/services/homeapi";
import { getAuthToken } from "@/utils/tokenUtils";

const FooterContext = createContext(null);

// ✅ Performance Optimization: Share React Query cache with Homepage
// Use the same query key as Homepage to share cache
export const FooterProvider = ({ children }) => {
  const { data: apiData, isLoading: loading, error } = useQuery({
    queryKey: ['homepage-content'], // Same key as Homepage - shares cache
    queryFn: async () => {
      const token = await getAuthToken();
      if (!token) throw new Error("No valid token");
      return await fetchHomePageContent(null);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - matches Homepage
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const footerData = apiData?.footer || null;

  return (
    <FooterContext.Provider value={{ footerData, loading, error }}>
      {children}
    </FooterContext.Provider>
  );
};

export const useFooter = () => {
  const ctx = useContext(FooterContext);
  if (!ctx) throw new Error("useFooter must be used inside FooterProvider");
  return ctx;
};
