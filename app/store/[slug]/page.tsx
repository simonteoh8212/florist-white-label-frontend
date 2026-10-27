import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreBySlug, getAllStoreSlugs } from "@/config/stores";
import { StorefrontClient } from "@/components/StorefrontClient";
import { getStoreEmergencyStatus } from "@/lib/storeStatus";

interface StorePageProps {
  params: Promise<{
    slug: string;
  }>;
}

/**
 * Generate dynamic document metadata & OpenGraph tags customized per store.
 */
export async function generateMetadata({
  params,
}: StorePageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    return {
      title: "Store Not Found | FlowerApp",
      description: "The requested florist store does not exist.",
    };
  }

  const currency = store.currency || "RM";

  return {
    title: `${store.name} | Artisanal Florist & Floral Gifts`,
    description:
      store.tagline ||
      `Explore ${store.name}'s curated floral arrangements and bouquets with same-day delivery in Malaysia. Prices in ${currency}.`,
    openGraph: {
      title: `${store.name} | Artisanal Floral Studio`,
      description:
        store.tagline ||
        `Handcrafted floral arrangements with seamless Touch 'n Go checkout and WhatsApp confirmation.`,
      url: `https://${store.slug}.flowerapp.my`,
      siteName: store.name,
      images: [
        {
          url: store.logo,
          width: 800,
          height: 800,
          alt: `${store.name} Logo`,
        },
      ],
      locale: "en_MY",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: store.name,
      description: store.tagline,
      images: [store.logo],
    },
  };
}

/**
 * Static generation parameter export for known tenant stores.
 */
export function generateStaticParams() {
  return getAllStoreSlugs().map((slug) => ({
    slug,
  }));
}

/**
 * Dynamic Multi-Tenant Storefront Page.
 */
export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  const initialStatus = await getStoreEmergencyStatus(store.slug);

  return <StorefrontClient store={store} initialStatus={initialStatus} />;
}
