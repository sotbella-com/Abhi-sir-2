import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

const initialForm = {
  orderId: "",
  subOrderId: "",
  type: "RETURN",
  items: [], // [{ productId, quantity, reason }]
  description: "",
  customerId: 1,
};

// ✅ CHANGE START: Exchange context (for PRODUCT_EXCHANGE flow)
const initialExchangeContext = {
  isExchangeFlow: false, // flag for exchange flow mode
  orderId: "",
  subOrderId: "",
  reason: "",
  description: "",
  customerId: 1,
  items: [], // original items from order (what user wants to exchange)
  images: [], // only names, never File objects

  // selected new product by user
  exchangeProductId: "",
  exchangeProductSlug: "",
};
// ✅ CHANGE END

export const useReturnExchangeStore = create(
  persist(
    (set, get) => ({
      // ✅ persisted
      order: null,
      form: initialForm,
      selectedReason: "",

      // ✅ CHANGE START: Exchange flow state (persisted)
      exchangeContext: initialExchangeContext,
      // ✅ CHANGE END

      // ✅ actions (stable)
      setOrder: (order) =>
        set((state) => ({
          order,
          form: {
            ...state.form,
            orderId: order?.id || order?.orderNo || state.form.orderId,
          },
        })),

      updateForm: (partial) =>
        set((state) => ({
          form: { ...state.form, ...partial },
        })),

      setItems: (items) =>
        set((state) => ({
          form: { ...state.form, items },
          selectedReason: items?.[0]?.reason || state.selectedReason || "",
        })),

      setSelectedReason: (reason) =>
        set((state) => {
          const current = state.form.items?.[0];
          return {
            selectedReason: reason,
            form: current
              ? { ...state.form, items: [{ ...current, reason }] }
              : state.form,
          };
        }),

      clearReturnExchange: () =>
        set({
          order: null,
          form: initialForm,
          selectedReason: "",
          // ✅ CHANGE START: also clear exchange flow when clearing whole store
          exchangeContext: initialExchangeContext,
          // ✅ CHANGE END
        }),

      // ✅ CHANGE START: Exchange flow actions (NEW)

      /**
       * Start PRODUCT_EXCHANGE flow (called when user chooses PRODUCT_EXCHANGE)
       * Keeps return functionality intact; does NOT modify existing form state unless you do separately.
       */
      startProductExchangeFlow: (payload) =>
        set((state) => ({
          exchangeContext: {
            ...initialExchangeContext,
            ...payload,
            isExchangeFlow: true,
          },
        })),

      /**
       * Set the product user selects from all-products page for exchange
       */
      setExchangeProduct: ({ exchangeProductId, exchangeProductSlug }) =>
        set((state) => ({
          exchangeContext: {
            ...state.exchangeContext,
            exchangeProductId: String(exchangeProductId || ""),
            exchangeProductSlug: String(exchangeProductSlug || ""),
          },
        })),

      /**
       * Clear only exchange flow data (use after exchange completed/cancelled)
       */
      clearExchangeContext: () =>
        set(() => ({
          exchangeContext: initialExchangeContext,
        })),

      /**
       * Optional helper: ensures exchange context exists (useful in pages that can be opened directly)
       * Returns boolean to let caller redirect if needed.
       */
      hydrateExchangeContext: () => {
        const ctx = get()?.exchangeContext;
        if (ctx?.isExchangeFlow && ctx?.orderId) return true;
        return false;
      },

      // ✅ CHANGE END
    }),
    {
      name: "return-exchange-store",
      version: 2, // ✅ CHANGE: bump version because we added new persisted state
      storage: createJSONStorage(() => localStorage),

      /**
       * ✅ CRITICAL:
       * Don't persist anything non-serializable.
       * We are NOT persisting images/files at all.
       */
      partialize: (state) => ({
        order: state.order,
        form: state.form,
        selectedReason: state.selectedReason,

        // ✅ CHANGE START: persist exchange context (serializable only)
        exchangeContext: state.exchangeContext,
        // ✅ CHANGE END
      }),
    }
  )
);
