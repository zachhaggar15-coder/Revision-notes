import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INVALID_JSON"
  | "INVALID_COURSE"
  | "NOTE_TOO_LONG"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE"
  | "RATE_LIMITED"
  | "AI_TIMEOUT"
  | "AI_PROVIDER_ERROR"
  | "EXTRACTION_FAILED"
  | "INTERNAL_ERROR";

export class PublicApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly retryAfterSeconds?: number;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = "PublicApiError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function apiErrorResponse(error: unknown, fallbackMessage: string) {
  const publicError =
    error instanceof PublicApiError
      ? error
      : new PublicApiError(500, "INTERNAL_ERROR", fallbackMessage);

  const headers = new Headers();
  if (publicError.retryAfterSeconds) {
    headers.set("Retry-After", String(publicError.retryAfterSeconds));
  }

  return NextResponse.json(
    {
      error: {
        code: publicError.code,
        message: publicError.message,
        retryAfterSeconds: publicError.retryAfterSeconds,
      },
    },
    {
      headers,
      status: publicError.status,
    },
  );
}

export function getSafeErrorLog(error: unknown) {
  if (error instanceof PublicApiError) {
    return {
      code: error.code,
      status: error.status,
      retryAfterSeconds: error.retryAfterSeconds,
    };
  }

  return {
    code: "INTERNAL_ERROR",
    status: 500,
  };
}
