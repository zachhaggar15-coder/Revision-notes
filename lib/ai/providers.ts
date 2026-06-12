import { AI_REQUEST_TIMEOUT_MS } from "@/lib/limits";
import { PublicApiError } from "@/lib/server/api-errors";

type GenerateTextInput = {
  systemPrompt: string;
  userPrompt: string;
  image?: {
    mimeType: string;
    dataBase64: string;
  };
};

type GenerateTextResult = {
  text: string;
  provider: "openai" | "anthropic";
};

type OpenAiResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

type AnthropicResponse = {
  content?: Array<{
    type: string;
    text?: string;
  }>;
  error?: {
    message?: string;
  };
};

type ProviderName = GenerateTextResult["provider"];

type ProviderFetchOptions = {
  body: unknown;
  headers: Record<string, string>;
  provider: ProviderName;
  url: string;
};

const DEFAULT_RETRY_COUNT = 1;

export async function generateTextWithConfiguredProvider(
  input: GenerateTextInput,
): Promise<GenerateTextResult | null> {
  const preferredProvider = (process.env.AI_PROVIDER || "").toLowerCase();

  if (preferredProvider === "anthropic" && process.env.ANTHROPIC_API_KEY) {
    return generateWithAnthropic(input);
  }

  if (preferredProvider === "openai" && process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(input);
  }

  if (process.env.OPENAI_API_KEY) {
    return generateWithOpenAI(input);
  }

  if (process.env.ANTHROPIC_API_KEY) {
    return generateWithAnthropic(input);
  }

  return null;
}

async function generateWithOpenAI(input: GenerateTextInput): Promise<GenerateTextResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const userContent = input.image
    ? [
        { type: "text", text: input.userPrompt },
        {
          type: "image_url",
          image_url: {
            url: `data:${input.image.mimeType};base64,${input.image.dataBase64}`,
          },
        },
      ]
    : input.userPrompt;

  const data = await fetchProviderJson<OpenAiResponse>({
    provider: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: {
      model,
      temperature: 0.25,
      messages: [
        { role: "system", content: input.systemPrompt },
        { role: "user", content: userContent },
      ],
    },
  });

  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) {
    throw new Error("OpenAI returned an empty response.");
  }

  return { text, provider: "openai" };
}

async function generateWithAnthropic(input: GenerateTextInput): Promise<GenerateTextResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured.");
  }

  const model = process.env.ANTHROPIC_MODEL || "claude-3-5-haiku-latest";
  const userContent = input.image
    ? [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: input.image.mimeType,
            data: input.image.dataBase64,
          },
        },
        { type: "text", text: input.userPrompt },
      ]
    : input.userPrompt;

  const data = await fetchProviderJson<AnthropicResponse>({
    provider: "anthropic",
    url: "https://api.anthropic.com/v1/messages",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: {
      model,
      max_tokens: 5000,
      temperature: 0.25,
      system: input.systemPrompt,
      messages: [{ role: "user", content: userContent }],
    },
  });

  const text = data.content
    ?.filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n")
    .trim();

  if (!text) {
    throw new Error("Anthropic returned an empty response.");
  }

  return { text, provider: "anthropic" };
}

async function fetchProviderJson<T>({
  body,
  headers,
  provider,
  url,
}: ProviderFetchOptions): Promise<T> {
  const retryCount = getRetryCount();
  const bodyText = JSON.stringify(body);

  for (let attempt = 0; attempt <= retryCount; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), getTimeoutMs());

    try {
      const response = await fetch(url, {
        body: bodyText,
        headers,
        method: "POST",
        signal: controller.signal,
      });
      const data = (await safeJson(response)) as ProviderErrorResponse & T;

      if (response.ok) {
        return data;
      }

      if (attempt < retryCount && shouldRetry(response.status)) {
        await sleep(getRetryDelayMs(attempt, response));
        continue;
      }

      throw providerError(provider, response.status);
    } catch (error) {
      if (error instanceof PublicApiError) {
        throw error;
      }

      const timedOut = error instanceof DOMException && error.name === "AbortError";
      if (attempt < retryCount && timedOut) {
        await sleep(getRetryDelayMs(attempt));
        continue;
      }

      throw new PublicApiError(
        timedOut ? 504 : 502,
        timedOut ? "AI_TIMEOUT" : "AI_PROVIDER_ERROR",
        timedOut
          ? "The AI provider took too long to respond. Please try again."
          : "The AI provider could not be reached. Please try again shortly.",
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  throw providerError(provider, 502);
}

type ProviderErrorResponse = {
  error?: {
    message?: string;
  };
};

async function safeJson(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function providerError(provider: ProviderName, status: number) {
  if (status === 401 || status === 403) {
    return new PublicApiError(
      502,
      "AI_PROVIDER_ERROR",
      `The ${provider} provider is not configured correctly. Check the server environment variables.`,
    );
  }

  if (status === 408 || status === 504) {
    return new PublicApiError(
      504,
      "AI_TIMEOUT",
      "The AI provider took too long to respond. Please try again.",
    );
  }

  if (status === 429) {
    return new PublicApiError(
      429,
      "RATE_LIMITED",
      "The AI provider is rate limited right now. Please try again shortly.",
      60,
    );
  }

  return new PublicApiError(
    502,
    "AI_PROVIDER_ERROR",
    "The AI provider could not complete this request. Please try again shortly.",
  );
}

function shouldRetry(status: number) {
  return status === 408 || status === 409 || status === 429 || status >= 500;
}

function getRetryCount() {
  const configured = Number(process.env.AI_RETRY_COUNT);
  if (!Number.isFinite(configured)) {
    return DEFAULT_RETRY_COUNT;
  }

  return Math.max(0, Math.min(2, Math.floor(configured)));
}

function getTimeoutMs() {
  const configured = Number(process.env.AI_REQUEST_TIMEOUT_MS);
  if (!Number.isFinite(configured)) {
    return AI_REQUEST_TIMEOUT_MS;
  }

  return Math.max(10_000, Math.min(90_000, Math.floor(configured)));
}

function getRetryDelayMs(attempt: number, response?: Response) {
  const retryAfter = response?.headers.get("retry-after");
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds)) {
      return Math.min(10_000, Math.max(1_000, seconds * 1000));
    }
  }

  return 700 * (attempt + 1);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
