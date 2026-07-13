import React, { useState, useEffect } from 'react';
import { useLogo } from '../../Hooks/useLogo';
import { fetchHomePageContent } from '../../api/services/homeapi';
import CollectionNavbar from '@/NewHomePage/components/navbar/CollectionNavbar';

const LogoNavbar = ({ ...props }) => {
  const [logoApiData, setLogoApiData] = useState(null);
  const logoData = useLogo(logoApiData);

  // Fetch logo data from API
  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const apiData = await fetchHomePageContent(null); // Will use dynamic site ID
        const logoObj = apiData?.header?.Logo?.[1];
        setLogoApiData(logoObj);
      } catch (error) {
      }
    };

    fetchLogo();
  }, []);

  return (
    <CollectionNavbar 
      logoSrc={logoData?.url} 
      logoAlt={logoData?.alt} 
      loading={logoData?.isLoading}
      {...props}
    />
  );
};

export default LogoNavbar;
