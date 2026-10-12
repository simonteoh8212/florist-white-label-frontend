export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  description: string;
  category?: string;
  tag?: string;
}

export type PaymentMode = "static_qr" | "gateway";

export interface FloristConfig {
  storeName: string;
  tagline?: string;
  logoUrl: string;
  brandHexColor: string;
  whatsappNumber: string;
  currency: string;
  pickupAddress?: string;

  // Payment Configuration
  // 'static_qr': Static TNG QR code + TNG App launcher + WhatsApp receipt confirmation (Free, no gateway fees)
  // 'gateway': Automated Payment Gateway (HitPay / Chip / Curlec / ToyyibPay) with auto-redirect return URL
  paymentMode: PaymentMode;

  // Static QR Settings
  tngQrUrl: string;
  tngAccountName?: string;
  tngDeepLink: string; // "tngewallet://" scheme for launching Touch 'n Go app on mobile

  // Gateway Settings (Optional, used if paymentMode === "gateway")
  gatewayCheckoutUrl?: string;

  products: Product[];
}

export const floristConfig: FloristConfig = {
  storeName: "L'Amour Floral Studio",
  tagline: "Artisanal Blooms • Fresh Daily Delivery",
  logoUrl: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=200&h=200&q=80",
  brandHexColor: "#BE185D", // Elegant Rose Palette
  whatsappNumber: "60123456789",
  tngAccountName: "L'Amour Floral Studio (TNG eWallet)",
  currency: "RM",
  pickupAddress: "No. 18, Jalan Telawi 3, Bangsar, 59100 Kuala Lumpur, Malaysia",

  // Switch between "static_qr" and "gateway"
  paymentMode: "static_qr",

  // Static QR & Mobile App Settings
  tngQrUrl: "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=TNG-EWALLET-PAYMENT-LAMOUR-FLORAL-STUDIO&color=0055b8&bgcolor=ffffff",
  tngDeepLink: "tngewallet://",

  // Gateway Checkout URL (Used if paymentMode === 'gateway')
  gatewayCheckoutUrl: "https://checkout.hitpayapp.com/pay/lamour-floral-demo",

  products: [
    {
      id: "prod-01",
      name: "Crimson Velvet Roses",
      price: 188,
      imageUrl: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      description: "20 premium long-stem Ecuadorian red roses nestled in cascading Italian eucalyptus and silk ribbon.",
      category: "Bouquets",
      tag: "Best Seller",
    },
    {
      id: "prod-02",
      name: "Pastel Peony & Hydrangea Dream",
      price: 168,
      imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      description: "Delicate blush pink peonies, soft blue hydrangeas, white spray roses, and dried bunny tails.",
      category: "Bouquets",
      tag: "Signature",
    },
    {
      id: "prod-03",
      name: "Sunny Sunflowers & Chamomile",
      price: 138,
      imageUrl: "https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=800&q=80",
      description: "Golden sunflowers paired with chamomile daisies and fresh greenery in rustic Korean wrapping.",
      category: "Bouquets",
      tag: "Popular",
    },
    {
      id: "prod-04",
      name: "Enchanted Lilac Glass Dome",
      price: 198,
      imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
      description: "Everlasting preserved lilac roses, hydrangeas, and warm fairy lights under a crystal glass bell jar.",
      category: "Preserved",
      tag: "Everlasting",
    },
    {
      id: "prod-05",
      name: "Dutch Sunset Tulip Bloom Box",
      price: 158,
      imageUrl: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
      description: "Fresh Dutch gradient sunset tulips styled in an embossed matte velvet keepsake circular box.",
      category: "Bloom Box",
      tag: "Limited",
    },
    {
      id: "prod-06",
      name: "Pure Orchid Sanctuary",
      price: 228,
      imageUrl: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
      description: "Double-stem white cascading Phalaenopsis orchids potted in handcrafted artisanal ceramic.",
      category: "Potted",
      tag: "Luxury",
    },
  ],
};
