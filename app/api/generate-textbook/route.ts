import { NextResponse } from "next/server";
import { generateFallbackTextbook } from "@/lib/ai/fallbacks";
import { buildTextbookPrompt } from "@/lib/ai/prompts/textbook";
import { generateTextWithConfiguredProvider } from "@/lib/ai/providers";
import { MAX_GENERATE_REQUEST_BYTES } from "@/lib/limits";
import { apiErrorResponse, getSafeErrorLog } from "@/lib/server/api-errors";
import { enforceRateLimit, generateTextbookRateLimit } from "@/lib/server/rate-limit";
import { readJsonWithLimit } from "@/lib/server/request";
import { validateGenerateTextbookPayload } from "@/lib/server/validation";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const start = Date.now();

  try {
    enforceRateLimit(request, generateTextbookRateLimit);
    const body = await readJsonWithLimit<unknown>(request, MAX_GENERATE_REQUEST_BYTES);
    const course = validateGenerateTextbookPayload(body);

    console.log(
      JSON.stringify({
        level: "info",
        msg: "ai_generation_start",
        route: "/api/generate-textbook",
        requestId: request.headers.get("x-vercel-id"),
        materialCount: course.materials.length,
        hasExistingTextbook: Boolean(course.masterTextbook),
      }),
    );

    const prompt = buildTextbookPrompt(course);
    const providerResult = await generateTextWithConfiguredProvider(prompt);

    if (providerResult) {
      console.log(
        JSON.stringify({
          level: "info",
          msg: "ai_generation_done",
          route: "/api/generate-textbook",
          provider: providerResult.provider,
          ms: Date.now() - start,
        }),
      );

      return NextResponse.json({
        textbook: providerResult.text,
        provider: providerResult.provider,
      });
    }

    console.log(
      JSON.stringify({
        level: "info",
        msg: "ai_generation_demo_fallback",
        route: "/api/generate-textbook",
        ms: Date.now() - start,
      }),
    );

    return NextResponse.json({
      textbook: generateFallbackTextbook(course),
      provider: "demo",
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "ai_generation_failed",
        route: "/api/generate-textbook",
        ...getSafeErrorLog(error),
        ms: Date.now() - start,
      }),
    );
    return apiErrorResponse(
      error,
      "CourseMind could not generate the textbook right now. Please try again.",
    );
  }
}
