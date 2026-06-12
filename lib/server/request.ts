import { PublicApiError } from "@/lib/server/api-errors";
import { formatBytes } from "@/lib/limits";

export async function readJsonWithLimit<T>(request: Request, maxBytes: number): Promise<T> {
  enforceContentLength(request, maxBytes);

  const body = await request.text();
  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    throw new PublicApiError(
      413,
      "BAD_REQUEST",
      `Request body is too large. Keep it under ${formatBytes(maxBytes)}.`,
    );
  }

  try {
    return JSON.parse(body) as T;
  } catch {
    throw new PublicApiError(400, "INVALID_JSON", "The request body must be valid JSON.");
  }
}

export function enforceContentLength(request: Request, maxBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return;
  }

  const parsedLength = Number(contentLength);
  if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
    throw new PublicApiError(
      413,
      "BAD_REQUEST",
      `Request body is too large. Keep it under ${formatBytes(maxBytes)}.`,
    );
  }
}
