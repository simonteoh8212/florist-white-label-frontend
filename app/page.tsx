import React from "react";
import Image from "next/image";
import Link from "next/link";
import { STORES } from "@/config/stores";
import {
  ArrowRight,
  ExternalLink,
  Layers,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
  Sparkles,
  Store,
  Terminal,
} from "lucide-react";

export default function RootPlatformPage() {
  const storeList = Object.values(STORES);

  return (
    <div className="min-h-screen bg-[#faf8f5] text-stone-900 selection:bg-rose-100 selection:text-rose-900">
      {/* Centered mobile-first and desktop-friendly platform container */}
      <main className="mx-auto flex min-h-screen max-w-xl flex-col bg-white shadow-2xl shadow-stone-200/60 sm:my-8 sm:rounded-3xl sm:border sm:border-stone-200/80 sm:overflow-hidden">
        {/* Platform Header */}
        <header className="border-b border-stone-100 bg-white/80 p-5 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-stone-900">
                  flowerapp<span className="text-rose-600">.my</span>
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 border border-emerald-200/60">
              <Layers className="h-3.5 w-3.5 text-emerald-600" />
              <span>Multi-Tenant Active</span>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="p-5 pb-3">
          <div className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 p-6 text-white shadow-lg">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-300">
              <Store className="h-3.5 w-3.5" />
              <span>Wildcard Subdomain Routing</span>
            </div>
            <h2 className="mt-2 text-xl font-extrabold tracking-tight leading-snug">
              Every Florist Gets Their Own Branded Subdomain
            </h2>
            <p className="mt-1.5 text-xs text-stone-300 leading-relaxed">
              Experience dynamic tenant switching powered by Next.js Edge Middleware. Each storefront features custom branding, isolated carts, Touch &apos;n Go QR proofs, and tailored WhatsApp checkout bridges.
            </p>

            <div className="mt-4 rounded-xl bg-white/10 p-2.5 text-[11px] text-stone-200 font-mono flex items-center gap-2 border border-white/10">
              <span className="text-amber-400 font-bold">*</span>
              <span>[subdomain].flowerapp.my &rarr; /store/[subdomain]</span>
            </div>
          </div>
        </section>

        {/* Tenant Florist Directory */}
        <section className="p-5 pt-3 space-y-4 flex-1">
          <div className="flex items-center justify-between border-b border-stone-100 pb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-stone-700">
              Explore Tenant Storefronts ({storeList.length})
            </span>
            <span className="text-[11px] text-stone-400">
              Select a store to test
            </span>
          </div>

          <div className="space-y-4">
            {storeList.map((store) => {
              const cleanNumber = store.whatsapp.replace(/\D/g, "");
              return (
                <div
                  key={store.id}
                  className="group relative rounded-3xl border border-stone-200/90 bg-[#FAF9F6] p-4 shadow-xs transition-all duration-300 hover:border-stone-300 hover:shadow-md"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Store Logo */}
                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xs">
                      <Image
                        src={store.logo}
                        alt={`${store.name} Logo`}
                        fill
                        className="object-contain p-1"
                      />
                    </div>

                    {/* Store Information */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: store.primaryColor }}
                        />
                        <h3 className="truncate text-sm font-bold text-stone-900">
                          {store.name}
                        </h3>
                      </div>

                      <p className="mt-0.5 text-xs text-stone-500 line-clamp-1">
                        {store.tagline}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-stone-600">
                        <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-stone-200 font-semibold">
                          {store.slug}.flowerapp.my
                        </span>
                        <span>•</span>
                        <span>{store.products.length} Products</span>
                      </div>
                    </div>
                  </div>

                  {/* Store Details snippet */}
                  {store.pickupAddress && (
                    <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-white/70 px-2.5 py-1.5 text-[11px] text-stone-600 border border-stone-200/60">
                      <MapPin
                        className="h-3 w-3 shrink-0"
                        style={{ color: store.primaryColor }}
                      />
                      <span className="truncate">{store.pickupAddress}</span>
                    </div>
                  )}

                  {/* Action Link Buttons */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2">
                    <Link
                      href={`/store/${store.slug}`}
                      className="flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs font-bold text-white shadow-xs transition-all active:scale-98 hover:opacity-95"
                      style={{ backgroundColor: store.primaryColor }}
                    >
                      <span>Visit Catalog</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>

                    <a
                      href={`http://${store.slug}.localhost:3000`}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-stone-200 bg-white py-2.5 px-3 text-xs font-semibold text-stone-700 hover:bg-stone-50 transition-colors"
                      title="Test local subdomain routing"
                    >
                      <span>Test Subdomain</span>
                      <ExternalLink className="h-3 w-3 text-stone-400" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Local Subdomain Testing Instructions */}
          <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-stone-900 mb-1.5">
              <Terminal className="h-4 w-4 text-stone-600" />
              <span>How to Test Subdomains Locally</span>
            </div>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Modern browsers resolve <code>*.localhost</code> directly to <code>127.0.0.1</code> without changing your hosts file:
            </p>
            <ul className="mt-2 space-y-1 font-mono text-[11px] text-stone-700 bg-stone-50 p-2.5 rounded-xl border border-stone-200/80">
              <li>&bull; <a href="http://autarix.localhost:3000" className="text-rose-700 underline underline-offset-2">http://autarix.localhost:3000</a></li>
              <li>&bull; <a href="http://greenland.localhost:3000" className="text-emerald-700 underline underline-offset-2">http://greenland.localhost:3000</a></li>
            </ul>
          </div>
        </section>

        {/* Platform Footer */}
        <footer className="mt-auto border-t border-stone-200/80 bg-stone-50 p-5 text-center">
          <p className="text-xs font-bold text-stone-800">
            FlowerApp.my Platform
          </p>
          <p className="mt-0.5 text-[11px] text-stone-500">
            Wildcard Subdomain Multi-Tenant Catalog Architecture
          </p>
        </footer>
      </main>
    </div>
  );
}
