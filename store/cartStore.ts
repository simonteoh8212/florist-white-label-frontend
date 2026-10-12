import { create } from "zustand";
import { Product } from "@/config/florist.config";

export type FulfillmentMethod = "delivery" | "pickup";

export interface CustomerDetails {
  name: string;
  phone: string;
  deliveryAddress: string;
  cardMessage: string;
  notes?: string;
}

export interface CartState {
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
  setSelectedProduct: (product: Product | null) => void;
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setCustomerDetails: (details: Partial<CustomerDetails>) => void;
  setCheckoutDrawerOpen: (isOpen: boolean) => void;
  setCheckoutStep: (step: 1 | 2) => void;
  openCheckoutWithProduct: (product: Product) => void;
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
  selectedProduct: null,
  fulfillmentMethod: "delivery",
  selectedDate: "",
  selectedTime: "",
  customerDetails: initialCustomerDetails,
  isCheckoutDrawerOpen: false,
  checkoutStep: 1,

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
      // Reset to step 1 when drawer is closed
      checkoutStep: isOpen ? state.checkoutStep : 1,
    })),

  setCheckoutStep: (checkoutStep) => set({ checkoutStep }),

  openCheckoutWithProduct: (product) =>
    set({
      selectedProduct: product,
      isCheckoutDrawerOpen: true,
      checkoutStep: 1,
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
