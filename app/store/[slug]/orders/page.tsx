import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStoreBySlug, getAllStoreSlugs } from "@/config/stores";
import { FloristOrderBookClient } from "@/components/FloristOrderBookClient";

interface OrdersPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: OrdersPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    return {
      title: "Store Not Found",
    };
  }

  return {
    title: `${store.name} | Florist Dispatch & Order Book`,
    description: `Staff dispatch terminal, order book, and delivery management for ${store.name}.`,
    robots: {
      index: false,
      follow: false,
    },
  };
}

export function generateStaticParams() {
  return getAllStoreSlugs().map((slug) => ({
    slug,
  }));
}

export default async function OrdersPage({ params }: OrdersPageProps) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  // Security: Never leak the real adminPin into client bundles or HTML
  const safeStore = {
    ...store,
    adminPin: undefined,
  };

  return <FloristOrderBookClient store={safeStore} />;
}
