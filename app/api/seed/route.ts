import { NextResponse } from "next/server";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url.includes("your-project-id")) {
    return NextResponse.json(
      { success: false, error: "Supabase not configured in .env" },
      { status: 400 }
    );
  }

  const getRelativeDateStr = (daysAhead = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const todayStr = getRelativeDateStr(0);
  const tomorrowStr = getRelativeDateStr(1);
  const upcomingStr = getRelativeDateStr(3);
  const yesterdayStr = getRelativeDateStr(-1);

  const SAMPLE_ORDERS = [
    {
      id: "ord_autarix_101",
      store_slug: "autarix",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      product_id: "prod-02",
      product_name: "Pastel Peony & Hydrangea Dream",
      product_price: 168.0,
      product_image: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?auto=format&fit=crop&w=800&q=80",
      addons: [
        { id: "led_lights", name: "Warm Fairy LED Lights", price: 10 },
        { id: "foil_balloon", name: "Happy Birthday Foil Balloon", price: 18 },
      ],
      fulfillment_method: "delivery",
      delivery_zone_name: "Georgetown / Ayer Itam / Farlim / Jelutong",
      delivery_fee: 10.0,
      delivery_date: todayStr,
      delivery_time_slot: "10:00 AM – 11:00 AM",
      recipient_name: "Sarah Tan",
      recipient_phone: "+60165541234",
      delivery_address: "12, Jalan Kelawai, 10250 Georgetown, Pulau Pinang",
      card_message: "Happy 25th Birthday Sarah! Wishing you endless joy, love, and sunshine. Love always, Bryan.",
      notes: "Please call upon arrival at the guardhouse.",
      total_amount: 206.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "preparing",
    },
    {
      id: "ord_autarix_102",
      store_slug: "autarix",
      created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      product_id: "prod-01",
      product_name: "Crimson Velvet Roses",
      product_price: 188.0,
      product_image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80",
      addons: [
        { id: "ferrero_box", name: "Ferrero Rocher Chocolates (3 pcs)", price: 15 },
      ],
      fulfillment_method: "delivery",
      delivery_zone_name: "Georgetown / Ayer Itam / Farlim / Jelutong",
      delivery_fee: 10.0,
      delivery_date: todayStr,
      delivery_time_slot: "02:00 PM – 03:00 PM",
      recipient_name: "Datin Melissa Tan",
      recipient_phone: "+60124458921",
      delivery_address: "8, Solok Cantonment, Pulau Tikus, 10350 George Town, Pulau Pinang",
      card_message: "Warmest 10th anniversary wishes to my dearest Melissa. Here is to forever together. Love, David.",
      notes: "Fragile bouquet. Please deliver to reception desk.",
      total_amount: 213.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "new",
    },
    {
      id: "ord_autarix_103",
      store_slug: "autarix",
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      product_id: "prod-03",
      product_name: "Champagne Whisper Luxury Cascade",
      product_price: 228.0,
      product_image: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?auto=format&fit=crop&w=800&q=80",
      addons: [],
      fulfillment_method: "delivery",
      delivery_zone_name: "Bayan Lepas / Gelugor / Tg Tokong / Gurney",
      delivery_fee: 18.0,
      delivery_date: tomorrowStr,
      delivery_time_slot: "11:00 AM – 12:00 PM",
      recipient_name: "Dr. Jason Ong",
      recipient_phone: "+60178829014",
      delivery_address: "Suite 3-02, Gurney Paragon Tower, Gurney Drive, 10250 George Town, Penang",
      card_message: "Heartiest congratulations on the grand opening of your new dental clinic! Wishing you resounding success.",
      notes: "Leave with front desk assistant.",
      total_amount: 246.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "new",
    },
    {
      id: "ord_autarix_104",
      store_slug: "autarix",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      product_id: "prod-05",
      product_name: "Ethereal White Lily Symphony",
      product_price: 158.0,
      product_image: "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=800&q=80",
      addons: [
        { id: "led_lights", name: "Warm Fairy LED Lights", price: 10 },
      ],
      fulfillment_method: "pickup",
      delivery_zone_name: undefined,
      delivery_fee: 0,
      delivery_date: upcomingStr,
      delivery_time_slot: "04:00 PM – 05:00 PM",
      recipient_name: "Michelle Lee",
      recipient_phone: "+60193321456",
      delivery_address: "Self-Pickup: 1-G-6, Medan Angsana 4, Farlim Business Centre",
      card_message: "Happy Graduation Michelle! Super proud of your accomplishment!",
      notes: "Customer picking up at store personally.",
      total_amount: 168.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "new",
    },
    {
      id: "ord_autarix_105",
      store_slug: "autarix",
      created_at: new Date(Date.now() - 3600000 * 28).toISOString(),
      product_id: "prod-04",
      product_name: "Blushing Twilight Tulips",
      product_price: 148.0,
      product_image: "https://images.unsplash.com/photo-1520763185298-1b434c919102?auto=format&fit=crop&w=800&q=80",
      addons: [],
      fulfillment_method: "delivery",
      delivery_zone_name: "Georgetown / Ayer Itam / Farlim / Jelutong",
      delivery_fee: 10.0,
      delivery_date: yesterdayStr,
      delivery_time_slot: "03:00 PM – 04:00 PM",
      recipient_name: "Amanda Khor",
      recipient_phone: "+60124987654",
      delivery_address: "55, Lebuh Chulia, 10200 Georgetown, Pulau Pinang",
      card_message: "Thinking of you always. Have a wonderful week ahead!",
      notes: "",
      total_amount: 158.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "completed",
    },
    {
      id: "ord_greenland_201",
      store_slug: "greenland",
      created_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      product_id: "prod-g-01",
      product_name: "Cascading White Phalaenopsis Orchid Ensemble",
      product_price: 280.0,
      product_image: "https://images.unsplash.com/photo-1525310072745-f49212b5ac6d?auto=format&fit=crop&w=800&q=80",
      addons: [
        { id: "calligraphy_card", name: "Handcrafted Calligraphy Greeting Card", price: 12 },
      ],
      fulfillment_method: "delivery",
      delivery_zone_name: "Mont Kiara / Sri Hartamas / Dutamas",
      delivery_fee: 10.0,
      delivery_date: todayStr,
      delivery_time_slot: "11:00 AM – 12:00 PM",
      recipient_name: "Evelyn Choong",
      recipient_phone: "+60123349876",
      delivery_address: "18, Jalan Kiara 1, Mont Kiara Pines, 50480 Kuala Lumpur",
      card_message: "Heartfelt congratulations on your new home! Wishing you warmth, peace, and abundance.",
      notes: "Leave with security lobby.",
      total_amount: 302.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "preparing",
    },
    {
      id: "ord_greenland_202",
      store_slug: "greenland",
      created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
      product_id: "prod-g-02",
      product_name: "Monstera Deliciosa Living Feature Plant",
      product_price: 188.0,
      product_image: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?auto=format&fit=crop&w=800&q=80",
      addons: [],
      fulfillment_method: "delivery",
      delivery_zone_name: "KL City Centre / Bangsar / Petaling Jaya",
      delivery_fee: 20.0,
      delivery_date: tomorrowStr,
      delivery_time_slot: "02:00 PM – 03:00 PM",
      recipient_name: "Marcus Wong",
      recipient_phone: "+60189912345",
      delivery_address: "The Troika, Tower B, Level 15, Persiaran KLCC, 50450 Kuala Lumpur",
      card_message: "Happy Birthday Marcus! May your year ahead be fruitful and prosperous.",
      notes: "Call recipient before going up.",
      total_amount: 208.0,
      payment_mode: "static_qr",
      payment_status: "paid_tng",
      fulfillment_status: "new",
    },
  ];

  const results: Record<string, string> = {};

  for (const order of SAMPLE_ORDERS) {
    try {
      const res = await fetch(`${url}/rest/v1/orders`, {
        method: "POST",
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(order),
      });

      if (res.ok) {
        results[order.id] = "Inserted successfully";
      } else {
        const errText = await res.text();
        results[order.id] = `Failed (${res.status}): ${errText}`;
      }
    } catch (err: unknown) {
      results[order.id] = `Exception: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json({
    success: true,
    message: "Seed operation executed against Supabase",
    results,
  });
}
