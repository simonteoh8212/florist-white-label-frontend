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

  // Fulfillment state
  fulfillmentMethod: FulfillmentMethod;
  selectedDate: string;
  selectedTime: string;

  // Customer details
  customerDetails: CustomerDetails;

  // UI state
  isCheckoutDrawerOpen: boolean;
  checkoutStep: 1 | 2;

  // Actions
  syncTenantStore: (store: StoreConfig) => void;
  setSelectedProduct: (product: Product | null) => void;
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;
  setCheckoutDrawerOpen: (isOpen: boolean) => void;
  setCheckoutStep: (step: 1 | 2) => void;
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
  fulfillmentMethod: "delivery",
  selectedDate: "",
  selectedTime: "",
  customerDetails: initialCustomerDetails,
  isCheckoutDrawerOpen: false,
  checkoutStep: 1,

  // Synchronizes tenant store and resets state if tenant changes
  syncTenantStore: (store: StoreConfig) =>
    set((state) => {
      if (state.currentStoreSlug !== store.slug) {
        return {
          currentStoreSlug: store.slug,
          currentStore: store,
          selectedProduct: null,
          fulfillmentMethod: "delivery",
          selectedDate: "",
          selectedTime: "",
          customerDetails: initialCustomerDetails,
          isCheckoutDrawerOpen: false,
          checkoutStep: 1,
        };
      }
      return { currentStore: store };
    }),

  setSelectedProduct: (product) => set({ selectedProduct: product }),

  setFulfillmentMethod: (fulfillmentMethod) => set({ fulfillmentMethod }),

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
      // If store is passed and different from currentStoreSlug, reset tenant data
      if (store && state.currentStoreSlug !== store.slug) {
        return {
          currentStoreSlug: store.slug,
          currentStore: store,
          selectedProduct: product,
          fulfillmentMethod: "delivery",
          selectedDate: "",
          selectedTime: "",
          customerDetails: initialCustomerDetails,
          isCheckoutDrawerOpen: true,
          checkoutStep: 1,
        };
      }
      return {
        selectedProduct: product,
        ...(store ? { currentStore: store, currentStoreSlug: store.slug } : {}),
        isCheckoutDrawerOpen: true,
        checkoutStep: 1,
      };
    }),

  resetCheckout: () =>
    set({
      selectedProduct: null,
      fulfillmentMethod: "delivery",
      selectedDate: "",
      selectedTime: "",
      customerDetails: initialCustomerDetails,
      isCheckoutDrawerOpen: false,
      checkoutStep: 1,
    }),
}));
