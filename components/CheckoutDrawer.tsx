"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useCartStore } from "@/store/cartStore";
import { floristConfig } from "@/config/florist.config";
import { TngPaymentView } from "@/components/TngPaymentView";
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Heart,
  MapPin,
  Phone,
  Store,
  Truck,
  User,
  X,
} from "lucide-react";

export const CheckoutDrawer: React.FC = () => {
  const isCheckoutDrawerOpen = useCartStore(
    (state) => state.isCheckoutDrawerOpen
  );
  const setCheckoutDrawerOpen = useCartStore(
    (state) => state.setCheckoutDrawerOpen
  );
  const checkoutStep = useCartStore((state) => state.checkoutStep);
  const setCheckoutStep = useCartStore((state) => state.setCheckoutStep);

  const selectedProduct = useCartStore((state) => state.selectedProduct);
  const fulfillmentMethod = useCartStore((state) => state.fulfillmentMethod);
  const setFulfillmentMethod = useCartStore(
    (state) => state.setFulfillmentMethod
  );
  const selectedDate = useCartStore((state) => state.selectedDate);
  const setSelectedDate = useCartStore((state) => state.setSelectedDate);
  const selectedTime = useCartStore((state) => state.selectedTime);
  const setSelectedTime = useCartStore((state) => state.setSelectedTime);
  const customerDetails = useCartStore((state) => state.customerDetails);
  const setCustomerDetails = useCartStore((state) => state.setCustomerDetails);

  const [validationError, setValidationError] = useState<string | null>(null);

  const timeSlots = [
    { id: "morning", label: "Morning", hours: "10:00 AM – 1:00 PM" },
    { id: "afternoon", label: "Afternoon", hours: "1:00 PM – 5:00 PM" },
    { id: "evening", label: "Evening", hours: "5:00 PM – 8:00 PM" },
  ];

  const setQuickDate = (daysAhead: number) => {
    const target = new Date();
    target.setDate(target.getDate() + daysAhead);
    const yyyy = target.getFullYear();
    const mm = String(target.getMonth() + 1).padStart(2, "0");
    const dd = String(target.getDate()).padStart(2, "0");
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!customerDetails.name.trim()) {
      setValidationError("Please enter your name.");
      return;
    }
    if (!customerDetails.phone.trim()) {
      setValidationError("Please enter your WhatsApp contact number.");
      return;
    }
    if (!selectedDate) {
      setValidationError("Please pick a fulfillment date.");
      return;
    }
    if (!selectedTime) {
      setValidationError("Please choose a preferred delivery time slot.");
      return;
    }
    if (fulfillmentMethod === "delivery" && !customerDetails.deliveryAddress.trim()) {
      setValidationError("Please enter your complete delivery address.");
      return;
    }

    setCheckoutStep(2);
  };

  return (
    <Drawer
      open={isCheckoutDrawerOpen}
      onOpenChange={setCheckoutDrawerOpen}
    >
      <DrawerContent className="max-w-md mx-auto overflow-hidden bg-[#FAF9F6] border-t border-stone-200">
        {/* Drawer Header */}
        <DrawerHeader className="relative border-b border-stone-200/60 bg-white/60 px-5 pt-3 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-xs"
                style={{ backgroundColor: floristConfig.brandHexColor }}
              >
                {checkoutStep}
              </span>
              <DrawerTitle className="text-base font-semibold text-stone-900 tracking-tight">
                {checkoutStep === 1
                  ? "Fulfillment & Details"
                  : "Touch 'n Go Payment"}
              </DrawerTitle>
            </div>
            <button
              type="button"
              onClick={() => setCheckoutDrawerOpen(false)}
              className="rounded-full p-1.5 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <DrawerDescription className="text-[12px] text-stone-500 mt-0.5">
            {checkoutStep === 1
              ? "Confirm your order items and schedule fulfillment."
              : "Scan the TNG QR code and confirm via WhatsApp."}
          </DrawerDescription>
        </DrawerHeader>

        {/* Scrollable Body */}
        <div className="max-h-[78vh] overflow-y-auto px-5 py-4">
          {checkoutStep === 1 ? (
            <form onSubmit={handleProceedToPayment} className="space-y-4 pb-6">
              {/* Selected Product Strip */}
              {selectedProduct && (
                <div className="flex items-center gap-3.5 rounded-2xl border border-stone-200/80 bg-white p-3 shadow-xs">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-100 border border-stone-200/60">
                    <Image
                      src={selectedProduct.imageUrl}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">
                      Selected Arrangement
                    </span>
                    <h4 className="truncate text-sm font-semibold text-stone-900 leading-snug">
                      {selectedProduct.name}
                    </h4>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span
                        className="text-sm font-bold"
                        style={{ color: floristConfig.brandHexColor }}
                      >
                        {floristConfig.currency} {selectedProduct.price.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-stone-400">• Qty: 1</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Fulfillment Method Switcher */}
              <div>
                <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Fulfillment Method
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl bg-stone-200/60 p-1">
                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod("delivery")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      fulfillmentMethod === "delivery"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Truck
                      className={`h-4 w-4 ${
                        fulfillmentMethod === "delivery"
                          ? "text-rose-600"
                          : "text-stone-400"
                      }`}
                    />
                    <span>Doorstep Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFulfillmentMethod("pickup")}
                    className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                      fulfillmentMethod === "pickup"
                        ? "bg-white text-stone-900 shadow-xs"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    <Store
                      className={`h-4 w-4 ${
                        fulfillmentMethod === "pickup"
                          ? "text-rose-600"
                          : "text-stone-400"
                      }`}
                    />
                    <span>Store Pickup</span>
                  </button>
                </div>

                {fulfillmentMethod === "pickup" && floristConfig.pickupAddress && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-stone-200/70 bg-white p-3 text-xs text-stone-600 shadow-2xs">
                    <MapPin className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                    <div>
                      <span className="font-semibold text-stone-900">
                        Atelier Pickup Address:
                      </span>
                      <p className="mt-0.5 text-[11px] text-stone-600 leading-relaxed">
                        {floristConfig.pickupAddress}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Date & Time Selection Card */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-3.5">
                {/* Date Input */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-stone-500" />
                      <span>Fulfillment Date</span>
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setQuickDate(0)}
                        className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                      >
                        Today
                      </button>
                      <button
                        type="button"
                        onClick={() => setQuickDate(1)}
                        className="rounded-md border border-stone-200 bg-stone-50 px-2 py-0.5 text-[10px] font-medium text-stone-700 hover:bg-stone-100 active:scale-95 transition-all cursor-pointer"
                      >
                        Tomorrow
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 px-3 py-2 text-xs text-stone-900 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Time slot picker */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-stone-500" />
                    <span>Preferred Time Slot</span>
                  </label>
                  <div className="grid grid-cols-1 gap-1.5">
                    {timeSlots.map((slot) => {
                      const fullSlotString = `${slot.label} (${slot.hours})`;
                      const isSelected = selectedTime === fullSlotString;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedTime(fullSlotString)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2.5 text-xs text-left transition-all cursor-pointer ${
                            isSelected
                              ? "border-rose-500/80 bg-rose-50/70 text-rose-950 font-semibold shadow-2xs"
                              : "border-stone-200/70 bg-stone-50/40 text-stone-700 hover:bg-stone-50 hover:border-stone-300"
                          }`}
                        >
                          <div>
                            <span className="font-semibold block">{slot.label}</span>
                            <span className="text-[11px] text-stone-500">{slot.hours}</span>
                          </div>
                          <div
                            className={`flex h-4 w-4 items-center justify-center rounded-full border transition-all ${
                              isSelected
                                ? "border-rose-600 bg-rose-600 text-white"
                                : "border-stone-300 bg-white"
                            }`}
                          >
                            {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Customer Details Section */}
              <div className="rounded-2xl border border-stone-200/80 bg-white p-3.5 shadow-xs space-y-3">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-600">
                  Recipient & Contact Details
                </label>

                {/* Name */}
                <div className="relative">
                  <User className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Recipient / Customer Name *"
                    value={customerDetails.name}
                    onChange={(e) =>
                      setCustomerDetails({ name: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Phone */}
                <div className="relative">
                  <Phone className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
                  <input
                    type="tel"
                    placeholder="WhatsApp Phone Number *"
                    value={customerDetails.phone}
                    onChange={(e) =>
                      setCustomerDetails({ phone: e.target.value })
                    }
                    required
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* Delivery Address (only when Delivery is selected) */}
                {fulfillmentMethod === "delivery" && (
                  <div className="relative">
                    <MapPin className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
                    <textarea
                      placeholder="Delivery Address (Unit/House No, Building, Street, Postcode, City) *"
                      rows={2}
                      value={customerDetails.deliveryAddress}
                      onChange={(e) =>
                        setCustomerDetails({ deliveryAddress: e.target.value })
                      }
                      required
                      className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                )}

                {/* Complimentary Card Message */}
                <div className="relative">
                  <Heart className="absolute top-2.5 left-3 h-4 w-4 text-stone-400" />
                  <textarea
                    placeholder="Complimentary Greeting Card Message (e.g. 'Happy Birthday Dear! Wishing you joy ✨')"
                    rows={2}
                    value={customerDetails.cardMessage}
                    onChange={(e) =>
                      setCustomerDetails({ cardMessage: e.target.value })
                    }
                    className="w-full rounded-xl border border-stone-200 bg-stone-50/50 py-2.5 pr-3 pl-9 text-xs text-stone-900 placeholder:text-stone-400 shadow-2xs focus:border-stone-400 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Inline Validation Alert */}
              {validationError && (
                <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-600 border border-red-200/80 animate-in fade-in duration-200">
                  {validationError}
                </div>
              )}

              {/* Proceed to Payment Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="flex w-full items-center justify-between rounded-xl py-3 px-4 text-sm font-semibold text-white shadow-md transition-all active:scale-98 hover:opacity-95 cursor-pointer"
                  style={{ backgroundColor: floristConfig.brandHexColor }}
                >
                  <span className="font-medium text-white/90">
                    Proceed to Payment
                  </span>
                  <div className="flex items-center gap-1.5 font-bold">
                    <span>
                      {selectedProduct
                        ? `${floristConfig.currency} ${selectedProduct.price.toFixed(2)}`
                        : ""}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </button>
              </div>
            </form>
          ) : (
            /* Step 2: TNG Payment View */
            <TngPaymentView />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
