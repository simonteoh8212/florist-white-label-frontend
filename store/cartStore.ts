import { create } from "zustand";
import { Product, StoreConfig } from "@/config/stores";

export type FulfillmentMethod = "delivery" | "pickup";

export interface CustomerDetails {
  name: string;
  phone: string;
  deliveryAddress: string;
  cardMessage: string;
  notes?: string;
}

export interface CartState {
  // Tenant identification
  currentStoreSlug: string | null;
  currentStore: StoreConfig | null;

  // Product state
  selectedProduct: Product | null;
  quantity: number;

  // Gift Add-ons state
  selectedAddonIds: string[];

  // Fulfillment state
  fulfillmentMethod: FulfillmentMethod;
  selectedDeliveryZoneId: string | null;
  selectedDate: string;
  selectedTime: string;

  // Customer details
  customerDetails: CustomerDetails;

  // UI state
  isCheckoutDrawerOpen: boolean;
  checkoutStep: 1 | 2 | 3;

  // Actions
  syncTenantStore: (store: StoreConfig) => void;
  setSelectedProduct: (product: Product | null) => void;
  setQuantity: (quantity: number) => void;
  toggleAddon: (addonId: string) => void;
  setSelectedAddonIds: (addonIds: string[]) => void;
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  setSelectedDeliveryZoneId: (zoneId: string | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;
  setCheckoutDrawerOpen: (isOpen: boolean) => void;
  setCheckoutStep: (step: 1 | 2 | 3) => void;
  openCheckoutWithProduct: (product: Product, store?: StoreConfig) => void;
  resetCheckout: () => void;
}

const initialCustomerDetails: CustomerDetails = {
  name: "",
  phone: "",
  deliveryAddress: "",
  cardMessage: "",
  notes: "",
};

export const useCartStore = create<CartState>((set) => ({
  currentStoreSlug: null,
  currentStore: null,

  selectedProduct: null,
  quantity: 1,
  selectedAddonIds: [],
  fulfillmentMethod: "delivery",
  selectedDeliveryZoneId: null,
  selectedDate: "",
  selectedTime: "",
  customerDetails: initialCustomerDetails,
  isCheckoutDrawerOpen: false,
  checkoutStep: 1,

  // Synchronizes tenant store and resets state if tenant changes
  syncTenantStore: (store: StoreConfig) =>
    set((state) => {
      const defaultZone =
        store.deliveryFeeConfig?.defaultZoneId ||
        store.deliveryFeeConfig?.zones?.[0]?.id ||
        null;
      if (state.currentStoreSlug !== store.slug) {
        return {
          currentStoreSlug: store.slug,
          currentStore: store,
          selectedProduct: null,
          quantity: 1,
          selectedAddonIds: [],
          fulfillmentMethod: "delivery",
          selectedDeliveryZoneId: defaultZone,
          selectedDate: "",
          selectedTime: "",
          customerDetails: initialCustomerDetails,
          isCheckoutDrawerOpen: false,
          checkoutStep: 1,
        };
      }
      return {
        currentStore: store,
        selectedDeliveryZoneId: state.selectedDeliveryZoneId || defaultZone,
      };
    }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setQuantity: (quantity: number) => set({ quantity }),

  toggleAddon: (addonId: string) =>
    set((state) => ({
      selectedAddonIds: state.selectedAddonIds.includes(addonId)
        ? state.selectedAddonIds.filter((id) => id !== addonId)
        : [...state.selectedAddonIds, addonId],
    })),

  setSelectedAddonIds: (selectedAddonIds: string[]) => set({ selectedAddonIds }),

  setFulfillmentMethod: (fulfillmentMethod) => set({ fulfillmentMethod }),

  setSelectedDeliveryZoneId: (selectedDeliveryZoneId) =>
    set({ selectedDeliveryZoneId }),

  setSelectedDate: (selectedDate) => set({ selectedDate }),

  setSelectedTime: (selectedTime) => set({ selectedTime }),

  setCustomerDetails: (details) =>
    set((state) => ({
      customerDetails: {
        ...state.customerDetails,
        ...details,
      },
    })),

  setCheckoutDrawerOpen: (isOpen) =>
    set((state) => ({
      isCheckoutDrawerOpen: isOpen,
      checkoutStep: isOpen ? state.checkoutStep : 1,
    })),

  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),

  openCheckoutWithProduct: (product, store) =>
    set((state) => {
      const targetStore = store || state.currentStore;
      const defaultZone =
        targetStore?.deliveryFeeConfig?.defaultZoneId ||
        targetStore?.deliveryFeeConfig?.zones?.[0]?.id ||
        null;

      // If store is passed and different from currentStoreSlug, reset tenant data
      if (store && state.currentStoreSlug !== store.slug) {
        return {
          currentStoreSlug: store.slug,
          currentStore: store,
          selectedProduct: product,
          quantity: 1,
          selectedAddonIds: [],
          fulfillmentMethod: "delivery",
          selectedDeliveryZoneId: defaultZone,
          selectedDate: "",
          selectedTime: "",
          customerDetails: initialCustomerDetails,
          isCheckoutDrawerOpen: true,
          checkoutStep: 1,
        };
      }
      const todayStr = new Date().toISOString().split("T")[0];
      const isPastDate = Boolean(state.selectedDate && state.selectedDate < todayStr);
      return {
        selectedProduct: product,
        quantity: 1,
        ...(store ? { currentStore: store, currentStoreSlug: store.slug } : {}),
        selectedDeliveryZoneId: state.selectedDeliveryZoneId || defaultZone,
        ...(isPastDate ? { selectedDate: "", selectedTime: "" } : {}),
        isCheckoutDrawerOpen: true,
        checkoutStep: 1,
      };
    }),

  resetCheckout: () =>
    set((state) => ({
      selectedProduct: null,
      quantity: 1,
      selectedAddonIds: [],
      fulfillmentMethod: "delivery",
      selectedDeliveryZoneId:
        state.currentStore?.deliveryFeeConfig?.defaultZoneId ||
        state.currentStore?.deliveryFeeConfig?.zones?.[0]?.id ||
        null,
      selectedDate: "",
      selectedTime: "",
      customerDetails: initialCustomerDetails,
      isCheckoutDrawerOpen: false,
      checkoutStep: 1,
    })),
}));
