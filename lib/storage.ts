import { createDemoCourse, DEMO_COURSE_ID } from "@/lib/demo-data";
import type {
  AnalyticsEventType,
  AnalyticsState,
  CourseModule,
  TextbookFeedback,
} from "@/lib/types";

const COURSES_KEY = "coursemind.modules.v1";
const ANALYTICS_KEY = "coursemind.analytics.v1";
const FEEDBACK_KEY = "coursemind.textbook-feedback.v1";
const SESSION_VISIT_KEY = "coursemind.visit.tracked";

export function createId(prefix = "cm") {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function getCourseModules(): CourseModule[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(COURSES_KEY);
    return raw ? (JSON.parse(raw) as CourseModule[]) : [];
  } catch {
    return [];
  }
}

export function saveCourseModules(courses: CourseModule[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(COURSES_KEY, JSON.stringify(courses));
}

export function ensureDemoCourse(courses = getCourseModules()) {
  const existing = courses.find((course) => course.id === DEMO_COURSE_ID);
  if (existing) {
    return courses;
  }

  const next = [createDemoCourse(), ...courses];
  saveCourseModules(next);
  return next;
}

function createInitialAnalytics(): AnalyticsState {
  const now = new Date().toISOString();

  return {
    visitorId: createId("visitor"),
    firstVisitAt: now,
    lastVisitAt: now,
    visitCount: 0,
    repeatVisits: 0,
    modulesCreated: 0,
    filesUploaded: 0,
    aiGenerations: 0,
    events: [],
  };
}

export function getAnalyticsState(): AnalyticsState {
  if (!canUseStorage()) {
    return createInitialAnalytics();
  }

  try {
    const raw = window.localStorage.getItem(ANALYTICS_KEY);
    return raw ? (JSON.parse(raw) as AnalyticsState) : createInitialAnalytics();
  } catch {
    return createInitialAnalytics();
  }
}

export function saveAnalyticsState(state: AnalyticsState) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ANALYTICS_KEY, JSON.stringify(state));
}

export function getTextbookFeedback(): TextbookFeedback[] {
  if (!canUseStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FEEDBACK_KEY);
    return raw ? (JSON.parse(raw) as TextbookFeedback[]) : [];
  } catch {
    return [];
  }
}

export function saveTextbookFeedback(feedback: TextbookFeedback[]) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(FEEDBACK_KEY, JSON.stringify(feedback));
}

export function getFeedbackForCourse(courseId: string) {
  return getTextbookFeedback().find((item) => item.courseId === courseId) ?? null;
}

export function saveFeedbackForCourse(feedback: TextbookFeedback) {
  const existing = getTextbookFeedback();
  const next = [
    feedback,
    ...existing.filter((item) => item.courseId !== feedback.courseId),
  ].slice(0, 100);

  saveTextbookFeedback(next);
  return feedback;
}

export function trackEvent(type: AnalyticsEventType, label?: string) {
  const state = getAnalyticsState();
  const now = new Date().toISOString();

  if (type === "module_created") {
    state.modulesCreated += 1;
  }

  if (type === "file_uploaded") {
    state.filesUploaded += 1;
  }

  if (type === "ai_generation_triggered") {
    state.aiGenerations += 1;
  }

  state.events = [
    {
      id: createId("event"),
      type,
      createdAt: now,
      label,
    },
    ...state.events,
  ].slice(0, 80);

  saveAnalyticsState(state);
  return state;
}

export function recordVisit() {
  return recordVisitResult().state;
}

export function recordVisitResult() {
  if (!canUseStorage()) {
    return {
      state: createInitialAnalytics(),
      recorded: false,
      repeatSession: false,
    };
  }

  const state = getAnalyticsState();

  if (window.sessionStorage.getItem(SESSION_VISIT_KEY)) {
    return {
      state,
      recorded: false,
      repeatSession: false,
    };
  }

  const now = new Date().toISOString();
  const lastVisitDay = state.lastVisitAt.slice(0, 10);
  const today = now.slice(0, 10);
  const repeatSession = state.visitCount > 0 && lastVisitDay !== today;

  if (repeatSession) {
    state.repeatVisits += 1;
  }

  state.visitCount += 1;
  state.lastVisitAt = now;
  state.events = [
    {
      id: createId("event"),
      type: "visit" as const,
      createdAt: now,
      label: "Session started",
    },
    ...state.events,
  ].slice(0, 80);

  saveAnalyticsState(state);
  window.sessionStorage.setItem(SESSION_VISIT_KEY, "true");
  return {
    state,
    recorded: true,
    repeatSession,
  };
}
