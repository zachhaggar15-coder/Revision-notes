import {
  MAX_COURSE_DESCRIPTION_CHARS,
  MAX_COURSE_NAME_CHARS,
  MAX_DOCUMENT_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_MATERIALS_PER_COURSE,
  MAX_SINGLE_MATERIAL_TEXT_CHARS,
  MAX_TEXT_UPLOAD_BYTES,
  MAX_TOTAL_COURSE_TEXT_CHARS,
  MAX_UNIVERSITY_CHARS,
  formatBytes,
} from "@/lib/limits";
import { PublicApiError } from "@/lib/server/api-errors";
import type {
  AcademicLevel,
  CourseModule,
  LearningMaterial,
  MaterialKind,
  MaterialStatus,
} from "@/lib/types";

const academicLevels: AcademicLevel[] = ["Undergraduate", "Masters", "PhD", "Other"];
const materialKinds: MaterialKind[] = ["PDF", "Image", "PowerPoint", "Text", "Other"];
const materialStatuses: MaterialStatus[] = ["ready", "needs_review"];

type GenerateTextbookPayload = {
  course?: unknown;
};

export function validateGenerateTextbookPayload(payload: unknown): CourseModule {
  const record = asRecord(payload, "Request body must be an object.") as GenerateTextbookPayload;
  const course = asRecord(record.course, "A valid course module is required.");
  const materialsValue = course.materials;

  if (!Array.isArray(materialsValue)) {
    throw new PublicApiError(400, "INVALID_COURSE", "Course materials must be an array.");
  }

  if (materialsValue.length === 0) {
    throw new PublicApiError(
      400,
      "INVALID_COURSE",
      "Add at least one learning material before generating a textbook.",
    );
  }

  if (materialsValue.length > MAX_MATERIALS_PER_COURSE) {
    throw new PublicApiError(
      413,
      "NOTE_TOO_LONG",
      `This module has too many materials for the MVP limit. Keep a module to ${MAX_MATERIALS_PER_COURSE} sources or fewer.`,
    );
  }

  const materials = materialsValue.map(validateLearningMaterial);
  const totalCharacters = materials.reduce(
    (total, material) => total + material.extractedText.length,
    0,
  );

  if (totalCharacters > MAX_TOTAL_COURSE_TEXT_CHARS) {
    throw new PublicApiError(
      413,
      "NOTE_TOO_LONG",
      `This module is too large to process safely. Keep combined notes under ${MAX_TOTAL_COURSE_TEXT_CHARS.toLocaleString()} characters.`,
    );
  }

  return {
    id: getString(course.id, "Course id", 160),
    name: getString(course.name, "Course name", MAX_COURSE_NAME_CHARS),
    description: getOptionalString(
      course.description,
      "Course description",
      MAX_COURSE_DESCRIPTION_CHARS,
    ),
    university: getOptionalString(course.university, "University", MAX_UNIVERSITY_CHARS) || undefined,
    academicLevel: getEnum(course.academicLevel, academicLevels, "Academic level"),
    createdAt: getOptionalString(course.createdAt, "Created date", 80) || new Date().toISOString(),
    updatedAt: getOptionalString(course.updatedAt, "Updated date", 80) || new Date().toISOString(),
    materials,
    masterTextbook:
      getOptionalString(course.masterTextbook, "Existing textbook", MAX_TOTAL_COURSE_TEXT_CHARS) ||
      undefined,
    textbookUpdatedAt:
      getOptionalString(course.textbookUpdatedAt, "Textbook updated date", 80) || undefined,
    generationCount:
      typeof course.generationCount === "number" && Number.isFinite(course.generationCount)
        ? Math.max(0, Math.floor(course.generationCount))
        : 0,
  };
}

export function validateUploadFile(file: File, materialType: MaterialKind) {
  if (file.size <= 0) {
    throw new PublicApiError(400, "BAD_REQUEST", "The uploaded file is empty.");
  }

  if (materialType === "Other") {
    throw new PublicApiError(
      415,
      "UNSUPPORTED_FILE",
      "This file type is not supported yet. Upload PDF, PowerPoint, image, Markdown, or plain text files.",
    );
  }

  const maxBytes =
    materialType === "Text"
      ? MAX_TEXT_UPLOAD_BYTES
      : materialType === "Image"
        ? MAX_IMAGE_UPLOAD_BYTES
        : MAX_DOCUMENT_UPLOAD_BYTES;

  if (file.size > maxBytes) {
    throw new PublicApiError(
      413,
      "FILE_TOO_LARGE",
      `${file.name || "This file"} is too large. Keep ${materialType.toLowerCase()} uploads under ${formatBytes(maxBytes)}.`,
    );
  }
}

function validateLearningMaterial(value: unknown): LearningMaterial {
  const material = asRecord(value, "Each learning material must be an object.");
  const extractedText = getString(
    material.extractedText,
    "Learning material text",
    MAX_SINGLE_MATERIAL_TEXT_CHARS,
  );

  return {
    id: getString(material.id, "Learning material id", 160),
    fileName: getString(material.fileName, "File name", 240),
    materialType: getEnum(material.materialType, materialKinds, "Material type"),
    uploadedAt:
      getOptionalString(material.uploadedAt, "Upload date", 80) || new Date().toISOString(),
    extractedText,
    extractionMethod: getString(material.extractionMethod, "Extraction method", 160),
    status: getEnum(material.status, materialStatuses, "Material status"),
  };
}

function asRecord(value: unknown, message: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PublicApiError(400, "BAD_REQUEST", message);
  }

  return value as Record<string, unknown>;
}

function getString(value: unknown, label: string, maxChars: number) {
  if (typeof value !== "string" || !value.trim()) {
    throw new PublicApiError(400, "INVALID_COURSE", `${label} is required.`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxChars) {
    throw new PublicApiError(
      413,
      "NOTE_TOO_LONG",
      `${label} is too long. Keep it under ${maxChars.toLocaleString()} characters.`,
    );
  }

  return trimmed;
}

function getOptionalString(value: unknown, label: string, maxChars: number) {
  if (value === undefined || value === null || value === "") {
    return "";
  }

  if (typeof value !== "string") {
    throw new PublicApiError(400, "INVALID_COURSE", `${label} must be text.`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxChars) {
    throw new PublicApiError(
      413,
      "NOTE_TOO_LONG",
      `${label} is too long. Keep it under ${maxChars.toLocaleString()} characters.`,
    );
  }

  return trimmed;
}

function getEnum<T extends string>(value: unknown, allowed: T[], label: string): T {
  if (typeof value === "string" && allowed.includes(value as T)) {
    return value as T;
  }

  throw new PublicApiError(400, "INVALID_COURSE", `${label} is not valid.`);
}
