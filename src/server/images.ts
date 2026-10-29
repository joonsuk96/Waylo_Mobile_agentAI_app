import type { Cover } from "../lib/trip-contract";
import { requireServerEnv } from "./env";

function referral(url: string) {
  const u = new URL(url);
  u.searchParams.set("utm_source", "waylo");
  u.searchParams.set("utm_medium", "referral");
  return u.toString();
}

export async function findCover(
  query: string,
  tripId: string,
): Promise<Cover | null> {
  const key = requireServerEnv("UNSPLASH_ACCESS_KEY");
  const endpoint = new URL("https://api.unsplash.com/search/photos");
  endpoint.searchParams.set("query", query);
  endpoint.searchParams.set("orientation", "landscape");
  endpoint.searchParams.set("per_page", "1");
  endpoint.searchParams.set("content_filter", "high");
  const headers = { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
  const r = await fetch(endpoint, {
    headers,
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error("Unsplash photo request failed");
  const data = await r.json();
  const photo = data.results?.[0];
  if (photo) {
    if (
      typeof photo.urls?.regular !== "string" ||
      !photo.urls.regular.startsWith("https://images.unsplash.com/")
    )
      throw Error("Unexpected image response");
    // Unsplash API requires hotlinking: do not download/re-upload their photos to ImageKit.
    const download = new URL(photo.links.download_location);
    if (download.origin !== "https://api.unsplash.com")
      throw Error("Unexpected photo tracking URL");
    const tracked = await fetch(download, {
      headers,
      signal: AbortSignal.timeout(10000),
    });
    if (!tracked.ok) throw Error("Photo selection tracking failed");
    return {
      url: photo.urls.regular,
      photographer: photo.user.name,
      photographerUrl: referral(photo.user.links.html),
      photoUrl: referral(photo.links.html),
      provider: "unsplash",
    };
  }
  // Only our own branded fallback is uploaded to ImageKit. Unsplash photos stay hotlinked.
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY?.trim();
  const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT?.trim();
  if (!privateKey || !urlEndpoint) return null;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800"><defs><linearGradient id="b"><stop stop-color="#2455be"/><stop offset="1" stop-color="#176b61"/></linearGradient></defs><path fill="url(#b)" d="M0 0h1200v800H0z"/><circle cx="950" cy="200" r="250" fill="#ffffff" opacity=".07"/><circle cx="300" cy="800" r="430" fill="#ffffff" opacity=".05"/><text x="90" y="420" font-family="sans-serif" font-size="100" fill="white">waylo.</text></svg>`;
  const form = new FormData();
  form.set("file", Buffer.from(svg).toString("base64"));
  form.set("fileName", `trip-${tripId}.svg`);
  form.set("folder", "/waylo/trips");
  form.set("useUniqueFileName", "false");
  const uploaded = await fetch(
    "https://upload.imagekit.io/api/v1/files/upload",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(privateKey + ":").toString("base64")}`,
      },
      body: form,
      signal: AbortSignal.timeout(20000),
    },
  );
  if (!uploaded.ok) throw Error("ImageKit cover upload failed");
  const file = await uploaded.json();
  const url = new URL(file.url);
  url.searchParams.set("tr", "w-1200,q-85,f-auto");
  if (!url.href.startsWith(urlEndpoint.replace(/\/$/, "") + "/"))
    throw Error("ImageKit endpoint mismatch");
  return {
    url: url.toString(),
    photographer: null,
    photographerUrl: null,
    photoUrl: null,
    provider: "imagekit",
  };
}
