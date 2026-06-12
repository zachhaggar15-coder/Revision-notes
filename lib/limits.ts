export const MAX_COURSE_NAME_CHARS = 120;
export const MAX_COURSE_DESCRIPTION_CHARS = 800;
export const MAX_UNIVERSITY_CHARS = 160;
export const MAX_MANUAL_NOTE_CHARS = 12_000;
export const MAX_MATERIALS_PER_COURSE = 40;
export const MAX_SINGLE_MATERIAL_TEXT_CHARS = 30_000;
export const MAX_TOTAL_COURSE_TEXT_CHARS = 90_000;
export const MAX_EXISTING_TEXTBOOK_CHARS = 20_000;
export const MAX_EXTRACTED_TEXT_CHARS = 30_000;

export const MAX_GENERATE_REQUEST_BYTES = 480_000;
export const MAX_EXTRACT_REQUEST_BYTES = 12 * 1024 * 1024;
export const MAX_TEXT_UPLOAD_BYTES = 2 * 1024 * 1024;
export const MAX_DOCUMENT_UPLOAD_BYTES = 8 * 1024 * 1024;
export const MAX_IMAGE_UPLOAD_BYTES = 6 * 1024 * 1024;

export const AI_REQUEST_TIMEOUT_MS = 45_000;
export const AI_CLIENT_TIMEOUT_MS = 70_000;
export const EXTRACTION_TIMEOUT_MS = 25_000;

export function countMaterialCharacters(
  materials: Array<{ extractedText: string }>,
) {
  return materials.reduce((total, material) => total + material.extractedText.length, 0);
}

export function truncateWithNotice(value: string, maxChars: number, notice: string) {
  if (value.length <= maxChars) {
    return value;
  }

  return `${value.slice(0, maxChars).trimEnd()}\n\n[${notice}]`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
