const FALLBACK_PRODUCTION_URL = "https://revision-notes-eight.vercel.app";
const STALE_PRODUCTION_URL = "https://revision-notes.vercel.app";
const LOCAL_URL = "http://localhost:3000";

export function getSiteUrl() {
  const explicitSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;

  if (explicitSiteUrl) {
    const normalizedSiteUrl = normalizeSiteUrl(explicitSiteUrl);

    if (process.env.NODE_ENV === "production" && normalizedSiteUrl === STALE_PRODUCTION_URL) {
      return FALLBACK_PRODUCTION_URL;
    }

    return normalizedSiteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    return FALLBACK_PRODUCTION_URL;
  }

  return normalizeSiteUrl(process.env.VERCEL_URL || LOCAL_URL);
}

function normalizeSiteUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, "");

  if (!trimmed) {
    return process.env.NODE_ENV === "production" ? FALLBACK_PRODUCTION_URL : LOCAL_URL;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}
