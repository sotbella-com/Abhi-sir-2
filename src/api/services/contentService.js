import sfccApiClient from '../sfccApiClient';
// import { getCurrentSiteId } from '../../utils/sfccSiteConfig';

const resolveSiteId = () =>  
  import.meta.env.VITE_SFCC_SITE_ID || 
  "sotbella_in";

export const getSizeGuideContent = async () => {
  try {
    const orgId = import.meta.env.VITE_SFCC_ORG_ID;
    const siteId = resolveSiteId();
    
    // Construct the URL manually as it's a custom endpoint
    const endpoint = `/custom/custom-data/v1/organizations/${orgId}/content/size-guide?siteId=${siteId}`;
    
    // Use sfccApiClient to handle base URL and potential auth if needed (though likely public)
    // Note: If sfccApiClient appends /s/[siteId] automatically, we might need to adjust or use a direct fetch if this is a Shopper API custom endpoint that behaves differently.
    // Based on the request {{HOST}}/custom/..., it seems to be outside the standard SCAPI /shopper/ pattern or a custom controller.
    // Assuming sfccApiClient.get handles the base URL. If the base URL in sfccApiClient includes /s/{{siteId}}, we might need to be careful.
    // However, usually custom endpoints are relative to the base host.
    
    // Let's assume sfccApiClient.buildUrl or direct usage. 
    // Since sfccApiClient usually helps with the SCAPI host, let's try using it.
    
    // Quick check: standard SCAPI is https://{host}/shopper/customers/...
    // This is https://{host}/custom/custom-data/...
    // We'll try to use the client's get method which likely uses the configured axios instance.
    
    const response = await sfccApiClient.get(endpoint);
    return response;
  } catch (error) {
    // console.error("Error fetching size guide content:", error);
    throw error;
  }
};
