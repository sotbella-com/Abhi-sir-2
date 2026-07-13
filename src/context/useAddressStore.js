import { create } from "zustand";
import { toast } from "react-toastify";
import { getAuthToken, getCustomerId, isUserLoggedIn } from "@/utils/tokenUtils";
import { SFCC_CONFIG } from "@/api/services";
import { getCustomer } from "@/api/services/sfccCustomers"; // uses SFCC Shopper Customers GET
// If you have a datalayer hook you still want to call:
// import { setLatestAddress } from "@/utils/dataLayer";

/**
 * Map raw SFCC address to the shape your UI already uses in Acaddress/Checkout:
 *  id, firstName, lastName, phone, address, cityName, stateName, countryName, isDefault
 */
const mapSFCCAddress = (a, preferredAddressId) => ({
  id: a.addressId,
  firstName: a.firstName ?? "",
  lastName: a.lastName ?? "",
  phone: a.phone ?? "",
  address1: a.address1 ?? "",
  address2: a.address2 ?? "",
  address: [a.address1, a.address2].filter(Boolean).join(", "),
  cityName: a.city ?? "",
  stateName: a.stateCode ?? "",
  postalCode: a.postalCode ?? "",
  countryName: a.countryCode ?? "",
  c_email: a.c_email ?? "",
  isDefault: Boolean(a.c_isDefault) || preferredAddressId === a.addressId,
});

const buildAddressUrl = (customerId, addressName) =>
  `${SFCC_CONFIG.baseUrl}/customer/shopper-customers/v1/organizations/${SFCC_CONFIG.organizationId}/customers/${customerId}/addresses/${addressName}?siteId=${SFCC_CONFIG.siteId}`;

const useAddressStore = create((set, get) => ({
  address: [],
  isLoading: false,

  setAddress: (arr) => set({ address: Array.isArray(arr) ? arr : [] }),
  clearAddress: () => set({ address: [] }),

  /**
   * Fetch addresses from SFCC (via getCustomer) and normalize for the UI.
   * Uses logged-in shopper context (Bearer access_token).
   */
  fetchAddress: async () => {
    try {
      if (!isUserLoggedIn()) {
        set({ address: [] });
        return;
      }

      set({ isLoading: true });

      // getCustomer should already call SFCC /customers/{customerId}?siteId=...
      const customer = await getCustomer();
      const preferred = customer?.preferredAddressId || "";
      const raw = Array.isArray(customer?.addresses) ? customer.addresses : [];

      const mapped = raw.map((a) => mapSFCCAddress(a, preferred));
      set({ address: mapped, isLoading: false });

      // Optional analytics hook (kept from your old store)
      try { setLatestAddress(mapped); } catch {}

    } catch (err) {
      set({ address: [], isLoading: false });
    }
  },

  /**
   * Delete a customer address in SFCC (204 expected on success),
   * then refresh the address list.
   *
   * @param {string} addressId  (aka addressName in SFCC)
   */
  deleteAddress: async (addressId) => {
    try {
      if (!addressId) throw new Error("addressId is required");

      const [accessToken, customerId] = await Promise.all([getAuthToken(), getCustomerId()]);
      if (!accessToken || !customerId) throw new Error("Not authenticated");

      const url = buildAddressUrl(customerId, addressId);
      const resp = await fetch(url, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
      });

      if (resp.status !== 204) {
        const text = await resp.text().catch(() => "");
        throw new Error(`Delete failed ${resp.status}: ${text}`);
      }

      // Refresh list after delete
      await get().fetchAddress();
      // toast.success("Address deleted successfully");
    } catch (err) {
      // toast.error("Failed to delete address");
      throw err;
    }
  },
}));

export default useAddressStore;
