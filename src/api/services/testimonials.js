const merchantId = import.meta.env.VITE_TAILOREDD_MERCHANT_ID;
const apiKey = import.meta.env.VITE_TAILOREDD_API_KEY;


export async function getStoreReviews({ limit = 10, status = "approved", hasMedia = "true" } = {}) {
  const url = `/tailoredd/store-reviews?limit=${limit}&status=${status}&hasMedia=${hasMedia}`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-Merchant-Id": merchantId,
      "X-API-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Store reviews failed (${res.status}): ${text}`);
  }

  return res.json();
}

const formatReviewDate = (createdAt) => {
  if (!createdAt) return "";

  // Firestore Timestamp object { _seconds: number }
  if (typeof createdAt === "object" && typeof createdAt._seconds === "number") {
    return new Date(createdAt._seconds * 1000).toLocaleDateString();
  }

  // ISO string (e.g., "2026-02-06T11:53:15.376Z")
  if (typeof createdAt === "string") {
    const d = new Date(createdAt);
    return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString();
  }

  return "";
};

const pickFirstString = (...vals) => {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return null;
};

const normalizeUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  return url;
};

const pickReviewMedia = (r) => {
  const asset0 = r?.mediaAssets?.[0];
  const media =
    pickFirstString(
      r?.mediaUrls?.[0],
      r?.mediaUrls?.[1],
      r?.mediaUrl,
      asset0?.secureUrl,
      asset0?.thumbnailUrl,
      asset0?.url
    );

  return normalizeUrl(media);
};


// Tailoredd response -> UI shape
export const mapStoreReviewToCard = (r) => {
  return {
    id: r?.id,
    media: pickReviewMedia(r),
    authorName: r?.authorName || "Anonymous",
    rating: Number(r?.rating || 0),
    message: r?.text || "",
    createdAtLabel: formatReviewDate(r?.createdAt),
    productId: r?.productId || r?.externalProductId || "",
    handle: r?.metadata?.handle || "",
    raw: r,
  };
};

