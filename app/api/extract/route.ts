import JSZip from "jszip";
import { NextResponse } from "next/server";
import { buildVisionExtractionPrompt } from "@/lib/ai/prompts/vision";
import { generateTextWithConfiguredProvider } from "@/lib/ai/providers";
import {
  EXTRACTION_TIMEOUT_MS,
  MAX_EXTRACT_REQUEST_BYTES,
  MAX_EXTRACTED_TEXT_CHARS,
  truncateWithNotice,
} from "@/lib/limits";
import { withTimeout } from "@/lib/server/async";
import { apiErrorResponse, getSafeErrorLog, PublicApiError } from "@/lib/server/api-errors";
import { enforceRateLimit, extractRateLimit } from "@/lib/server/rate-limit";
import { enforceContentLength } from "@/lib/server/request";
import { validateUploadFile } from "@/lib/server/validation";
import type { ExtractResponse, MaterialKind } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_PPTX_SLIDES = 120;

export async function POST(request: Request) {
  const start = Date.now();

  try {
    enforceRateLimit(request, extractRateLimit);
    enforceContentLength(request, MAX_EXTRACT_REQUEST_BYTES);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new PublicApiError(400, "BAD_REQUEST", "No file was uploaded.");
    }

    const materialType = inferMaterialKind(file.name, file.type);
    validateUploadFile(file, materialType);
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(
      JSON.stringify({
        level: "info",
        msg: "extract_start",
        route: "/api/extract",
        requestId: request.headers.get("x-vercel-id"),
        materialType,
        fileSize: file.size,
      }),
    );

    const result = await withTimeout(
      extractText(file.name, file.type, buffer, materialType),
      EXTRACTION_TIMEOUT_MS,
      "File extraction took too long. Try a smaller file or paste the key notes manually.",
      "EXTRACTION_FAILED",
    );

    console.log(
      JSON.stringify({
        level: "info",
        msg: "extract_done",
        route: "/api/extract",
        materialType,
        ms: Date.now() - start,
      }),
    );

    return NextResponse.json({
      fileName: file.name,
      materialType,
      ...limitExtractedText(result),
    } satisfies ExtractResponse);
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        msg: "extract_failed",
        route: "/api/extract",
        ...getSafeErrorLog(error),
        ms: Date.now() - start,
      }),
    );
    return apiErrorResponse(
      error,
      "CourseMind could not read that file. Try a smaller file or paste the notes manually.",
    );
  }
}

function inferMaterialKind(fileName: string, mimeType: string): MaterialKind {
  const lowerName = fileName.toLowerCase();

  if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
    return "PDF";
  }

  if (
    mimeType.startsWith("image/") ||
    [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => lowerName.endsWith(ext))
  ) {
    return "Image";
  }

  if (
    lowerName.endsWith(".pptx") ||
    mimeType === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "PowerPoint";
  }

  if (
    mimeType.startsWith("text/") ||
    [".txt", ".md", ".markdown", ".csv"].some((ext) => lowerName.endsWith(ext))
  ) {
    return "Text";
  }

  return "Other";
}

async function extractText(
  fileName: string,
  mimeType: string,
  buffer: Buffer,
  materialType: MaterialKind,
) {
  if (materialType === "Text") {
    return {
      extractedText: buffer.toString("utf8").trim(),
      extractionMethod: "Plain text extraction",
    };
  }

  if (materialType === "PDF") {
    try {
      const { default: pdfParse } = await import("pdf-parse");
      const parsed = await pdfParse(buffer);
      return {
        extractedText: parsed.text.trim() || "No selectable text was found in this PDF.",
        extractionMethod: "PDF text extraction",
      };
    } catch {
      return {
        extractedText:
          "PDF uploaded, but text extraction was not available for this file. Paste the important slide text or notes as a text upload to enrich the course memory.",
        extractionMethod: "PDF fallback note",
        warning: "PDF extraction needs review.",
      };
    }
  }

  if (materialType === "PowerPoint") {
    const extractedText = await extractPptxText(buffer);

    return {
      extractedText:
        extractedText ||
        "PowerPoint uploaded, but no slide text was found. If the deck uses images of text, upload key screenshots or paste the slide notes.",
      extractionMethod: "PowerPoint slide text extraction",
      warning: extractedText ? undefined : "PowerPoint extraction needs review.",
    };
  }

  if (materialType === "Image") {
    const prompt = buildVisionExtractionPrompt(fileName);
    const providerResult = await generateTextWithConfiguredProvider({
      ...prompt,
      image: {
        mimeType: mimeType || "image/png",
        dataBase64: buffer.toString("base64"),
      },
    });

    if (providerResult) {
      return {
        extractedText: providerResult.text,
        extractionMethod: `${providerResult.provider} vision extraction`,
      };
    }

    return {
      extractedText:
        "Image uploaded. Configure OPENAI_API_KEY or ANTHROPIC_API_KEY to enable OCR and diagram understanding for images. For now, add a manual text note describing the image.",
      extractionMethod: "Vision-ready fallback",
      warning: "Image extraction requires an AI vision provider.",
    };
  }

  return {
    extractedText:
      "File uploaded. CourseMind could not extract this file type automatically, so add the key learning points as a plain text note.",
    extractionMethod: "Unsupported file fallback",
    warning: "Unsupported file type.",
  };
}

function limitExtractedText(result: Omit<ExtractResponse, "fileName" | "materialType">) {
  if (result.extractedText.length <= MAX_EXTRACTED_TEXT_CHARS) {
    return result;
  }

  return {
    ...result,
    extractedText: truncateWithNotice(
      result.extractedText,
      MAX_EXTRACTED_TEXT_CHARS,
      "Extracted text trimmed for the MVP note-length limit. Split long files into smaller uploads if key details are missing.",
    ),
    warning: result.warning || "Extracted text was trimmed.",
  };
}

async function extractPptxText(buffer: Buffer) {
  try {
    const zip = await JSZip.loadAsync(buffer);
    const slideFiles = Object.keys(zip.files)
      .filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name))
      .sort((a, b) => extractSlideNumber(a) - extractSlideNumber(b))
      .slice(0, MAX_PPTX_SLIDES);

    const slides = await Promise.all(
      slideFiles.map(async (name) => {
        const file = zip.file(name);
        if (!file) {
          return "";
        }

        const xml = await file.async("text");
        const textRuns = Array.from(xml.matchAll(/<a:t>(.*?)<\/a:t>/g)).map((match) =>
          decodeXml(match[1]),
        );

        return textRuns.length
          ? `Slide ${extractSlideNumber(name)}\n${textRuns.join("\n")}`
          : "";
      }),
    );

    return slides.filter(Boolean).join("\n\n").trim();
  } catch {
    return "";
  }
}

function extractSlideNumber(path: string) {
  const match = path.match(/slide(\d+)\.xml$/);
  return match ? Number(match[1]) : 0;
}

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}
