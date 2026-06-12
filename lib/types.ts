export type AcademicLevel = "Undergraduate" | "Masters" | "PhD" | "Other";

export type MaterialKind = "PDF" | "Image" | "PowerPoint" | "Text" | "Other";

export type MaterialStatus = "ready" | "needs_review";

export type LearningMaterial = {
  id: string;
  fileName: string;
  materialType: MaterialKind;
  uploadedAt: string;
  extractedText: string;
  extractionMethod: string;
  status: MaterialStatus;
};

export type CourseModule = {
  id: string;
  name: string;
  description: string;
  university?: string;
  academicLevel: AcademicLevel;
  createdAt: string;
  updatedAt: string;
  materials: LearningMaterial[];
  masterTextbook?: string;
  textbookUpdatedAt?: string;
  generationCount?: number;
};

export type TextbookFeedback = {
  id: string;
  courseId: string;
  courseName: string;
  useful: boolean;
  missing?: string;
  createdAt: string;
};

export type AnalyticsEventType =
  | "visit"
  | "module_created"
  | "file_uploaded"
  | "ai_generation_triggered"
  | "demo_loaded";

export type AnalyticsEvent = {
  id: string;
  type: AnalyticsEventType;
  createdAt: string;
  label?: string;
};

export type AnalyticsState = {
  visitorId: string;
  firstVisitAt: string;
  lastVisitAt: string;
  visitCount: number;
  repeatVisits: number;
  modulesCreated: number;
  filesUploaded: number;
  aiGenerations: number;
  events: AnalyticsEvent[];
};

export type ExtractResponse = {
  fileName: string;
  materialType: MaterialKind;
  extractedText: string;
  extractionMethod: string;
  warning?: string;
};
