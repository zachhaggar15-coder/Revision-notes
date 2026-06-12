"use client";

import { track } from "@vercel/analytics";

type AnalyticsValue = string | number | boolean | null;
type AnalyticsProperties = Record<string, AnalyticsValue | undefined>;

export function trackProductEvent(name: string, properties: AnalyticsProperties = {}) {
  try {
    track(name, sanitiseProperties(properties));
  } catch {
    // Analytics must never interrupt the study workflow.
  }
}

function sanitiseProperties(properties: AnalyticsProperties) {
  return Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined),
  ) as Record<string, AnalyticsValue>;
}
