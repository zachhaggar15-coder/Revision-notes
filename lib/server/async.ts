import { PublicApiError } from "@/lib/server/api-errors";
import type { ApiErrorCode } from "@/lib/server/api-errors";

export async function withTimeout<T>(
  task: Promise<T>,
  timeoutMs: number,
  message: string,
  code: ApiErrorCode = "AI_TIMEOUT",
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutTask = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new PublicApiError(504, code, message));
    }, timeoutMs);
  });

  try {
    return await Promise.race([task, timeoutTask]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}
