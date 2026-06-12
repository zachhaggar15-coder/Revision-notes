const FALLBACK_PRODUCTION_URL = "https://revision-notes.vercel.app";
const LOCAL_URL = "http://localhost:3000";

export function getSiteUrl() {
  return normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.SITE_URL ||
      process.env.VERCEL_PROJECT_PRODUCTION_URL ||
      process.env.VERCEL_URL ||
      (process.env.NODE_ENV === "production" ? FALLBACK_PRODUCTION_URL : LOCAL_URL),
  );
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
