import type { DeliveryZone } from "@/config/stores";

export interface ZoneDetectionResult {
  zoneId: string;
  zone: DeliveryZone;
  matchedBy: "postcode" | "keyword" | "zone_name";
  matchedText: string;
}

/**
 * Known Malaysian Postcode ranges mapped to specific zone criteria/IDs or area keywords.
 * Works seamlessly with Google Autofill, Apple Keychain, and manual address input.
 */
interface PostcodeRule {
  /** Single 5-digit string or RegExp pattern */
  pattern: RegExp;
  /** Primary zone identifiers or keyword triggers to look for in store zones */
  candidateZoneIds: string[];
  fallbackKeywords: string[];
  label: string;
}

const POSTCODE_RULES: PostcodeRule[] = [
  // --- PENANG ISLAND ---
  // Ayer Itam / Farlim
  {
    pattern: /^1150\d|^11400/,
    candidateZoneIds: ["island_ayer_itam", "ayer_itam", "farlim"],
    fallbackKeywords: ["ayer itam", "air itam", "farlim", "亚依淡", "发林"],
    label: "Ayer Itam / Farlim",
  },
  // Georgetown / Jelutong
  {
    pattern: /^10[0-4]\d{2}|^10990|^11600/,
    candidateZoneIds: ["island_central", "georgetown", "jelutong"],
    fallbackKeywords: ["georgetown", "george town", "jelutong", "乔治市", "日落洞"],
    label: "Georgetown / Jelutong",
  },
  // Bayan Lepas / Gelugor / Tanjung Tokong / Gurney / Outer Island
  {
    pattern: /^10470|^110[0-2]0|^11050|^11100|^11200|^11700|^119[0-6]0/,
    candidateZoneIds: ["island_outer", "bayan_lepas", "gelugor", "tanjung_tokong"],
    fallbackKeywords: ["bayan lepas", "gelugor", "tanjung tokong", "gurney", "峇六拜", "牛汝莪"],
    label: "Outer Island / Bayan Lepas / Tg Tokong",
  },
  // Penang Mainland (Butterworth, Bukit Mertajam, Seberang Perai)
  {
    pattern: /^1[2-4]\d{3}/,
    candidateZoneIds: ["penang_mainland", "mainland", "butterworth", "bukit_mertajam"],
    fallbackKeywords: ["mainland", "butterworth", "bukit mertajam", "北海", "大山脚", "威省"],
    label: "Penang Mainland",
  },

  // --- KLANG VALLEY (KL / SELANGOR) ---
  // Mont Kiara / Sri Hartamas / Dutamas
  {
    pattern: /^50480|^50490|^51200/,
    candidateZoneIds: ["mont_kiara", "hartamas", "dutamas"],
    fallbackKeywords: ["mont kiara", "hartamas", "dutamas", "满家乐"],
    label: "Mont Kiara / Sri Hartamas",
  },
  // KL City Centre / Bangsar / Petaling Jaya
  {
    pattern: /^50[0-4]\d{2}|^55[1-3]\d{2}|^59[0-2]\d{2}|^46\d{3}|^473\d{2}|^474\d{2}/,
    candidateZoneIds: ["kl_city_bangsar", "kl_central", "petaling_jaya", "bangsar"],
    fallbackKeywords: ["kl city", "bangsar", "petaling jaya", "pj", "吉隆坡", "孟沙", "八打灵"],
    label: "KL City Centre / Bangsar / PJ",
  },
  // Greater KL (Shah Alam, Subang Jaya, Klang, Puchong, Kajang, Cyberjaya)
  {
    pattern: /^40\d{3}|^47[56]\d{2}|^41\d{3}|^42\d{3}|^471\d{2}|^43\d{3}/,
    candidateZoneIds: ["greater_kl", "shah_alam", "subang", "puchong", "klang"],
    fallbackKeywords: ["shah alam", "subang jaya", "klang", "puchong", "莎阿南", "梳邦", "巴生", "蒲种"],
    label: "Greater KL",
  },
];

/**
 * Known keyword dictionary mapping aliases and landmarks to specific zone IDs or keywords.
 * Sorted by specificity (longer phrases first).
 */
interface KeywordRule {
  keywords: string[];
  candidateZoneIds: string[];
  fallbackKeywords: string[];
}

const KEYWORD_RULES: KeywordRule[] = [
  // Ayer Itam / Farlim
  {
    keywords: [
      "all seasons place",
      "bandar baru air itam",
      "bandar baru ayer itam",
      "ayer itam",
      "air itam",
      "farlim",
      "kek lok si",
      "thean teik",
      "kampung melayu",
      "paya terubong",
      "发林",
      "亚依淡",
      "极乐寺",
      "垄尾",
      "天德园",
    ],
    candidateZoneIds: ["island_ayer_itam", "ayer_itam", "farlim"],
    fallbackKeywords: ["ayer itam", "air itam", "farlim", "亚依淡", "发林"],
  },
  // Georgetown / Jelutong
  {
    keywords: [
      "george town",
      "georgetown",
      "jelutong",
      "perak road",
      "jalan perak",
      "komtar",
      "macalister",
      "pulau tikus",
      "weld quay",
      "chulia street",
      "penang road",
      "burmah road",
      "jalan burmah",
      "1st avenue",
      "prangin mall",
      "乔治市",
      "日落洞",
      "光大",
      "浮罗池滑",
      "霹雳冷",
      "车水路",
      "柑仔园",
    ],
    candidateZoneIds: ["island_central", "georgetown", "jelutong"],
    fallbackKeywords: ["georgetown", "jelutong", "乔治市", "日落洞"],
  },
  // Outer Island / Bayan Lepas / Gurney / Tg Tokong
  {
    keywords: [
      "bayan lepas",
      "bayan baru",
      "relau",
      "sungai ara",
      "sg ara",
      "bukit jambul",
      "queensbay",
      "batu maung",
      "gelugor",
      "minden heights",
      "tanjung tokong",
      "tg tokong",
      "tanjong tokong",
      "straits quay",
      "tanjung bungah",
      "tg bungah",
      "tanjong bungah",
      "gurney drive",
      "gurney plaza",
      "gurney paragon",
      "gurney",
      "batu ferringhi",
      "balik pulau",
      "teluk bahang",
      "峇六拜",
      "牛汝莪",
      "丹绒道光",
      "丹绒武雅",
      "新关仔角",
      "皇后湾",
      "理大",
      "湖内",
      "峇都丁宜",
      "浮罗山背",
    ],
    candidateZoneIds: ["island_outer", "bayan_lepas", "gelugor", "tanjung_tokong"],
    fallbackKeywords: ["bayan lepas", "gelugor", "tg tokong", "gurney", "峇六拜"],
  },
  // Penang Mainland
  {
    keywords: [
      "butterworth",
      "bukit mertajam",
      "seberang perai",
      "seberang jaya",
      "perai",
      "prai",
      "juru",
      "auto city",
      "icon city",
      "simpang ampat",
      "raja uda",
      "bagan ajam",
      "bagan luar",
      "bagan",
      "kepala batas",
      "nibong tebal",
      "alma",
      "machang bubok",
      "sungai bakap",
      "valdor",
      "tambun",
      "北海",
      "大山脚",
      "威省",
      "拉惹乌达",
      "柔府",
      "新邦安拔",
      "高渊",
      "阿儿玛",
    ],
    candidateZoneIds: ["penang_mainland", "mainland", "butterworth", "bukit_mertajam"],
    fallbackKeywords: ["mainland", "butterworth", "bukit mertajam", "北海", "大山脚", "威省"],
  },

  // Klang Valley - Mont Kiara
  {
    keywords: [
      "mont kiara",
      "mont'kiara",
      "sri hartamas",
      "hartamas",
      "dutamas",
      "publika",
      "solaris mont kiara",
      "solaris dutamas",
      "满家乐",
      "金地花园",
    ],
    candidateZoneIds: ["mont_kiara", "hartamas", "dutamas"],
    fallbackKeywords: ["mont kiara", "hartamas", "dutamas", "满家乐"],
  },
  // Klang Valley - KL City / Bangsar / PJ
  {
    keywords: [
      "klcc",
      "bukit bintang",
      "bangsar south",
      "bangsar",
      "mid valley",
      "petaling jaya",
      "pj",
      "damansara utama",
      "damansara perdana",
      "kota damansara",
      "damansara",
      "ttdi",
      "ss2",
      "bandar utama",
      "kelana jaya",
      "ara damansara",
      "吉隆坡市中心",
      "吉隆坡",
      "孟沙",
      "八打灵",
      "八打灵再也",
    ],
    candidateZoneIds: ["kl_city_bangsar", "kl_central", "petaling_jaya", "bangsar"],
    fallbackKeywords: ["kl city", "bangsar", "petaling jaya", "吉隆坡", "孟沙", "八打灵"],
  },
  // Klang Valley - Greater KL
  {
    keywords: [
      "shah alam",
      "subang jaya",
      "subang",
      "usj",
      "bandar sunway",
      "sunway",
      "klang",
      "port klang",
      "puchong",
      "bandar puteri",
      "cyberjaya",
      "putrajaya",
      "kajang",
      "莎阿南",
      "梳邦再也",
      "梳邦",
      "双威",
      "巴生",
      "蒲种",
    ],
    candidateZoneIds: ["greater_kl", "shah_alam", "subang", "puchong", "klang"],
    fallbackKeywords: ["shah alam", "subang jaya", "klang", "puchong", "莎阿南", "梳邦", "巴生"],
  },
];

/**
 * Finds a matching zone from `zones` given candidate IDs or fallback keywords.
 */
function resolveZone(
  zones: DeliveryZone[],
  candidateZoneIds: string[],
  fallbackKeywords: string[]
): DeliveryZone | null {
  // 1. Try direct ID match
  for (const id of candidateZoneIds) {
    const found = zones.find((z) => z.id.toLowerCase() === id.toLowerCase());
    if (found) return found;
  }

  // 2. Try match zone name / nameZh with fallback keywords
  for (const kw of fallbackKeywords) {
    const kwLower = kw.toLowerCase();
    const found = zones.find(
      (z) =>
        z.name.toLowerCase().includes(kwLower) ||
        (z.nameZh && z.nameZh.toLowerCase().includes(kwLower))
    );
    if (found) return found;
  }

  return null;
}

/**
 * Detects the most accurate DeliveryZone for a given address string.
 *
 * Evaluation Strategy:
 * 1. Postcode Regex Extraction (e.g. 5-digit Malaysian postcode from mobile autofill or typed address)
 * 2. Curated Landmark & Area Keyword Matching (e.g. "Farlim", "Georgetown", "Bayan Lepas", "Publika")
 * 3. Dynamic Zone Name / NameZh Sub-area Tokens (works automatically for any custom store zones)
 *
 * Returns null if no confident match is found, preventing erroneous overrides.
 */
export function detectDeliveryZone(
  address: string | undefined | null,
  zones: DeliveryZone[]
): ZoneDetectionResult | null {
  if (!address || !zones || zones.length === 0) return null;

  const raw = address.trim();
  if (raw.length < 3) return null;

  const normalized = raw.toLowerCase();

  // -------------------------------------------------------------
  // TIER 1: Postcode Detection (Highest Accuracy, instant autofill)
  // -------------------------------------------------------------
  // Find all 5-digit number sequences in the address
  const postcodeMatches = raw.match(/\b\d{5}\b/g);
  if (postcodeMatches && postcodeMatches.length > 0) {
    for (const code of postcodeMatches) {
      for (const rule of POSTCODE_RULES) {
        if (rule.pattern.test(code)) {
          const matchedZone = resolveZone(zones, rule.candidateZoneIds, rule.fallbackKeywords);
          if (matchedZone) {
            return {
              zoneId: matchedZone.id,
              zone: matchedZone,
              matchedBy: "postcode",
              matchedText: code,
            };
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // TIER 2: Curated Landmark & Sub-Area Keyword Matching
  // -------------------------------------------------------------
  for (const rule of KEYWORD_RULES) {
    for (const kw of rule.keywords) {
      const isCjk = /[\u4e00-\u9fa5]/.test(kw);
      // For short English words (<= 3 chars like "pj", "usj", "bm"), enforce word boundary
      if (!isCjk && kw.length <= 3) {
        const wordBoundaryRegex = new RegExp(`\\b${kw}\\b`, "i");
        if (wordBoundaryRegex.test(raw)) {
          const matchedZone = resolveZone(zones, rule.candidateZoneIds, rule.fallbackKeywords);
          if (matchedZone) {
            return {
              zoneId: matchedZone.id,
              zone: matchedZone,
              matchedBy: "keyword",
              matchedText: kw,
            };
          }
        }
      } else {
        // Standard substring match (case-insensitive for English, direct for CJK)
        if (normalized.includes(kw.toLowerCase())) {
          const matchedZone = resolveZone(zones, rule.candidateZoneIds, rule.fallbackKeywords);
          if (matchedZone) {
            return {
              zoneId: matchedZone.id,
              zone: matchedZone,
              matchedBy: "keyword",
              matchedText: kw,
            };
          }
        }
      }
    }
  }

  // -------------------------------------------------------------
  // TIER 3: Dynamic Zone Name Token Matching (Generic for any store)
  // -------------------------------------------------------------
  // Break down zone names and nameZh into distinct sub-area tokens (e.g. "Georgetown / Jelutong" -> ["georgetown", "jelutong"])
  for (const zone of zones) {
    const rawTokens: string[] = [
      ...zone.name.split(/[\/,()\-–—]+/),
      ...(zone.nameZh ? zone.nameZh.split(/[\/,()\-–—、]+/) : []),
    ];

    const tokens = rawTokens
      .map((t) => t.trim())
      .filter((t) => t.length >= 3); // Ignore very short fragments

    // Sort longest token first for maximum specificity
    tokens.sort((a, b) => b.length - a.length);

    for (const token of tokens) {
      const tokenLower = token.toLowerCase();
      if (normalized.includes(tokenLower)) {
        return {
          zoneId: zone.id,
          zone,
          matchedBy: "zone_name",
          matchedText: token,
        };
      }
    }
  }

  return null;
}
